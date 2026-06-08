import { Router } from "express";
import pool, { getIsMysqlHealthy, setMysqlHealthy } from "../../lib/mysql";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import admin from "firebase-admin";
import { getFirestore as getFirestoreAdmin } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Leggiamo la configurazione client per estrarre la corretta istanza del database Firestore
let firestoreDatabaseId: string | undefined = undefined;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    firestoreDatabaseId = config.firestoreDatabaseId;
  }
} catch (e) {
  console.error("Error reading firebase-applet-config.json in API:", e);
}

const router = Router();
const db = admin.apps.length ? (firestoreDatabaseId ? getFirestoreAdmin(admin.app(), firestoreDatabaseId) : admin.firestore()) : null;

// Gestiamo SQLite come fallback. Dobbiamo recuperare o inizializzare il DB.
let sqliteDb: any = null;
async function getSqliteDb() {
  if (!sqliteDb) {
    sqliteDb = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });
  }
  return sqliteDb;
}

// Funzione helper centralizzata per estrarre il comune attivo configurato sul backend
async function getActiveComuneKeyServer(dbSq: any): Promise<string> {
  let key = "naro";
  try {
    if (getIsMysqlHealthy() && pool) {
      const [rows]: any = await pool.query("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
      if (rows && rows[0]) {
        key = rows[0].value_data;
      }
    } else {
      const row = await dbSq.get("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
      if (row) {
        key = row.value_data;
      }
    }
  } catch (err) {
    console.error("Errore lettura activeComune:", err);
  }
  return key;
}

router.get("/", async (req, res) => {
  try {
    let list = [];
    let usedSqlite = true;
    const dbSq = await getSqliteDb();
    const activeComune = await getActiveComuneKeyServer(dbSq);
    const email = req.query.email as string | undefined;

    if (getIsMysqlHealthy() && pool) {
      try {
        let queryStr = "SELECT * FROM segnalazioni WHERE comune_key = ? ORDER BY created_at DESC";
        let params = [activeComune];
        if (email) {
          queryStr = "SELECT * FROM segnalazioni WHERE comune_key = ? AND email_segnalante = ? ORDER BY created_at DESC";
          params = [activeComune, email];
        }
        const [rows] = await pool.query<any>(queryStr, params);
        list = rows.map((r: any) => ({
          id: r.id.toString(),
          codiceTracking: r.codice_tracking,
          specie: r.specie,
          condizioni: r.condizioni,
          descrizione: r.descrizione,
          fotoUrl: r.foto_url,
          latitudine: r.latitudine,
          longitudine: r.longitudine,
          indirizzo: r.indirizzo,
          stato: r.stato,
          urgenza: r.urgenza,
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString()
        }));
        usedSqlite = false;
      } catch (err) {
        console.error("Errore query MySQL segnalazioni GET, applico fallback su SQLite:", err);
        setMysqlHealthy(false);
      }
    }
    
    if (usedSqlite) {
      let queryStr = "SELECT * FROM segnalazioni WHERE comune_key = ? ORDER BY created_at DESC";
      let params = [activeComune];
      if (email) {
        queryStr = "SELECT * FROM segnalazioni WHERE comune_key = ? AND email_segnalante = ? ORDER BY created_at DESC";
        params = [activeComune, email];
      }
      const rows = await dbSq.all(queryStr, params);
      list = rows.map((r: any) => ({
        id: r.id.toString(),
        codiceTracking: r.codice_tracking,
        specie: r.specie,
        condizioni: r.condizioni,
        descrizione: r.descrizione,
        fotoUrl: r.foto_url,
        latitudine: r.latitudine,
        longitudine: r.longitudine,
        indirizzo: r.indirizzo,
        stato: r.stato,
        urgenza: r.urgenza,
        createdAt: r.created_at || new Date().toISOString(),
        updatedAt: r.updated_at || new Date().toISOString()
      }));
    }
    res.json(list);
  } catch (error: any) {
    console.error("GET reports error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      specie, 
      condizioni, 
      descrizione, 
      emailSegnalante, 
      consensoPrivacy, 
      fotoUrl, 
      indirizzo,
      nomeSegnalante,
      cognomeSegnalante,
      telefonoSegnalante,
      dichiarazioneVeridicita,
      assunzioneResponsabilita
    } = req.body;

    if (!nomeSegnalante || !cognomeSegnalante || !telefonoSegnalante || !emailSegnalante) {
      return res.status(400).json({ error: "I dati identificativi del segnalante (nome, cognome, telefono, email) sono obbligatori." });
    }

    if (!consensoPrivacy) {
      return res.status(400).json({ error: "Il consenso al trattamento della privacy è obbligatorio." });
    }

    if (!dichiarazioneVeridicita || !assunzioneResponsabilita) {
      return res.status(400).json({ error: "Le dichiarazioni di responsabilità legale (veridicità e assunzione responsabilità) sono obbligatorie." });
    }

    const dbSq = await getSqliteDb();
    const activeComune = await getActiveComuneKeyServer(dbSq);
    const prefix = activeComune.toUpperCase();
    const anno = new Date().getFullYear();
    
    let count = 0;
    let countSuccess = false;
    if (getIsMysqlHealthy() && pool) {
      try {
        const [rows] = await pool.query<any>("SELECT COUNT(*) as count FROM segnalazioni WHERE YEAR(created_at) = ?", [anno]);
        count = rows[0]?.count || 0;
        countSuccess = true;
      } catch (err) {
        console.error("Errore query MySQL segnalazione count, applico fallback su SQLite:", err);
        setMysqlHealthy(false);
      }
    }
    
    if (!countSuccess) {
      const row = await dbSq.get("SELECT COUNT(*) as count FROM segnalazioni WHERE strftime('%Y', created_at) = ?", [anno.toString()]);
      count = row?.count || 0;
    }
    
    const numero = String(count + 1).padStart(4, "0");
    const codiceTracking = `${prefix}-${anno}-${numero}`;

    const urgenza = (condizioni === "FERITO" || condizioni === "AGGRESSIVO") ? "ALTA" : "NORMALE";
    const fullName = `${nomeSegnalante || ""} ${cognomeSegnalante || ""}`.trim() || null;
    const finalDesc = `${descrizione || ""}${telefonoSegnalante ? ` [Telefono: ${telefonoSegnalante}]` : ""}`.trim();

    let sqlId = 0;
    let insertSuccess = false;

    if (getIsMysqlHealthy() && pool) {
      try {
        const [result] = await pool.execute<any>(`
          INSERT INTO segnalazioni (
            comune_key, codice_tracking, specie, condizioni, descrizione, foto_url, 
            latitudine, longitudine, indirizzo, stato, urgenza, 
            email_segnalante, consenso_privacy, nome_segnalante
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          activeComune, codiceTracking, specie, condizioni, finalDesc, fotoUrl, 
          lat, lng, indirizzo, "CREATA", urgenza, 
          emailSegnalante || null, consensoPrivacy ? 1 : 0, fullName
        ]);
        sqlId = result.insertId;
        insertSuccess = true;
      } catch (err) {
        console.error("Errore query MySQL segnalazione insert, applico fallback su SQLite:", err);
        setMysqlHealthy(false);
      }
    }
    
    if (!insertSuccess) {
      const insertResult = await dbSq.run(`
        INSERT INTO segnalazioni (
          comune_key, codice_tracking, specie, condizioni, descrizione, foto_url, 
          latitudine, longitudine, indirizzo, stato, urgenza, 
          email_segnalante, consenso_privacy, nome_segnalante
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        activeComune, codiceTracking, specie, condizioni, finalDesc, fotoUrl, 
        lat, lng, indirizzo, "CREATA", urgenza, 
        emailSegnalante || null, consensoPrivacy ? 1 : 0, fullName
      ]);
      sqlId = insertResult.lastID;
    }

    let firestoreId = sqlId.toString();

    if (db) {
      const docRef = await db.collection("segnalazioni").add({
        relationalId: sqlId,
        comuneKey: activeComune,
        codiceTracking,
        specie,
        condizioni,
        descrizione: finalDesc,
        fotoUrl,
        latitudine: lat,
        longitudine: lng,
        indirizzo,
        stato: "CREATA",
        urgenza,
        nomeSegnalante: fullName,
        emailSegnalante,
        telefonoSegnalante,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      firestoreId = docRef.id;
    }

    res.json({ id: firestoreId, codiceTracking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:codiceTracking/stato", async (req, res) => {
  try {
    const { codiceTracking } = req.params;
    const { stato } = req.body;

    if (!stato) return res.status(400).json({ error: "Stato obbligatorio" });

    // Aggiorna MySQL/SQLite
    let updateSuccess = false;
    if (getIsMysqlHealthy() && pool) {
      try {
        await pool.execute(
          "UPDATE segnalazioni SET stato = ?, updated_at = NOW() WHERE codice_tracking = ?",
          [stato, codiceTracking]
        );
        updateSuccess = true;
      } catch (err) {
        console.error("Errore query MySQL segnalazione update stato, applico fallback su SQLite:", err);
        setMysqlHealthy(false);
      }
    }
    
    if (!updateSuccess) {
      const dbSq = await getSqliteDb();
      await dbSq.run(
        "UPDATE segnalazioni SET stato = ?, updated_at = CURRENT_TIMESTAMP WHERE codice_tracking = ?",
        [stato, codiceTracking]
      );
    }

    // Sincronizza Firestore (che guida la UI realtime)
    if (db) {
      const snapshot = await db.collection("segnalazioni").where("codiceTracking", "==", codiceTracking).get();
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { 
            stato, 
            updatedAt: admin.firestore.FieldValue.serverTimestamp() 
          });
        });
        await batch.commit();
      }
    }

    res.json({ success: true, codiceTracking, stato });
  } catch (error: any) {
    console.error("PUT stato error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/:codiceTracking/log", async (req, res) => {
  try {
    const { codiceTracking } = req.params;
    const { operatore, azione, note, nuovoStato } = req.body;

    if (!operatore || !azione) return res.status(400).json({ error: "Operatore e azione obbligatori" });

    const dbSq = await getSqliteDb();
    const activeComune = await getActiveComuneKeyServer(dbSq);

    // Inserisce il log
    let logSuccess = false;
    if (getIsMysqlHealthy() && pool) {
      try {
        await pool.execute(
          "INSERT INTO interventi_logs (comune_key, segnalazione_codice, operatore, azione, note) VALUES (?, ?, ?, ?, ?)",
          [activeComune, codiceTracking, operatore, azione, note || ""]
        );
        if (nuovoStato) {
          await pool.execute(
            "UPDATE segnalazioni SET stato = ?, updated_at = NOW() WHERE codice_tracking = ?",
            [nuovoStato, codiceTracking]
          );
        }
        logSuccess = true;
      } catch (err) {
        console.error("Errore query MySQL log insert, applico fallback su SQLite:", err);
        setMysqlHealthy(false);
      }
    }
    
    if (!logSuccess) {
      await dbSq.run(
        "INSERT INTO interventi_logs (comune_key, segnalazione_codice, operatore, azione, note) VALUES (?, ?, ?, ?, ?)",
        [activeComune, codiceTracking, operatore, azione, note || ""]
      );
      if (nuovoStato) {
        await dbSq.run(
          "UPDATE segnalazioni SET stato = ?, updated_at = CURRENT_TIMESTAMP WHERE codice_tracking = ?",
          [nuovoStato, codiceTracking]
        );
      }
    }

    let userEmail = null;
    let userName = "Cittadino";

    if (nuovoStato && db) {
      const snapshot = await db.collection("segnalazioni").where("codiceTracking", "==", codiceTracking).get();
      if (!snapshot.empty) {
        userEmail = snapshot.docs[0].data().emailSegnalante;
        userName = snapshot.docs[0].data().nomeSegnalante;
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { 
            stato: nuovoStato, 
            updatedAt: admin.firestore.FieldValue.serverTimestamp() 
          });
        });
        await batch.commit();
      }
    } else {
      // Find from sql
      let sqlLookupSuccess = false;
      if (getIsMysqlHealthy() && pool) {
        try {
          const [rows]: any = await pool.execute("SELECT email_segnalante, nome_segnalante FROM segnalazioni WHERE codice_tracking = ?", [codiceTracking]);
          if (rows[0]) {
            userEmail = rows[0].email_segnalante;
            userName = rows[0].nome_segnalante;
          }
          sqlLookupSuccess = true;
        } catch (err) {
          console.error("Errore query MySQL lookup segnalazione, applico fallback su SQLite:", err);
          setMysqlHealthy(false);
        }
      }
      
      if (!sqlLookupSuccess) {
        const row = await dbSq.get("SELECT email_segnalante, nome_segnalante FROM segnalazioni WHERE codice_tracking = ?", [codiceTracking]);
        if (row) {
          userEmail = row.email_segnalante;
          userName = row.nome_segnalante;
        }
      }
    }

    // Trigger Notifica Cittadino e operatore
    if (userEmail) {
      try {
        const { Resend } = await import("resend");
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: userEmail,
            subject: `Aggiornamento Segnalazione ${codiceTracking} - AnimalHub PA`,
            html: `<p>Gentile ${userName},</p><p>La tua pratica <strong>${codiceTracking}</strong> ha ricevuto un aggiornamento reale:</p><p>Azione: ${azione}</p><p>Nuovo stato: <strong>${nuovoStato || 'Invariato'}</strong></p>`
          });
          console.log(`[TRIGGER NOTIFICA] Email inviata con successo a ${userEmail}`);
        } else {
          console.log(`[TRIGGER NOTIFICA DRY_RUN] Per inviare l'email inserisci la variabile RESEND_API_KEY nel file .env (utente: ${userEmail})`);
        }
      } catch(e: any) {
        console.error("Errore invio notifica email", e.message);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("POST log error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
