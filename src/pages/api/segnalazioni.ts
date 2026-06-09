import express, { Router } from "express";
import pool, { getIsMysqlHealthy, setMysqlHealthy } from "../../lib/mysql";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

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
router.use(express.json({ limit: "20mb" }));
const db = admin.apps.length ? (firestoreDatabaseId ? getFirestoreAdmin(admin.app(), firestoreDatabaseId) : admin.firestore()) : null;
function getFirestoreAdmin(app: any, id: string) {
    const { getFirestore } = require('firebase-admin/firestore');
    return getFirestore(app, id);
}

async function getActiveComuneKeyServer(): Promise<string> {
  let key = "naro";
  try {
    if (getIsMysqlHealthy() && pool) {
      const [rows]: any = await pool.query("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
      if (rows && rows[0]) {
        key = rows[0].value_data;
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
    const activeComune = await getActiveComuneKeyServer();
    const email = req.query.email as string | undefined;

    if (getIsMysqlHealthy() && pool) {
      let queryStr = "SELECT * FROM segnalazioni WHERE comune_key = ? ORDER BY created_at DESC";
      let params = [activeComune];
      if (email) {
        queryStr = "SELECT * FROM segnalazioni WHERE comune_key = ? AND email_segnalante = ? ORDER BY created_at DESC";
        params = [activeComune, email];
      }
      const [rows]: any = await pool.query(queryStr, params);
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
      lat, lng, specie, condizioni, descrizione, emailSegnalante, 
      consensoPrivacy, fotoUrl, indirizzo, nomeSegnalante, cognomeSegnalante,
      telefonoSegnalante, dichiarazioneVeridicita, assunzioneResponsabilita
    } = req.body;

    if (!nomeSegnalante || !cognomeSegnalante || !telefonoSegnalante || !emailSegnalante) {
      return res.status(400).json({ error: "Dati identificativi obbligatori." });
    }
    if (!consensoPrivacy) return res.status(400).json({ error: "Consenso privacy obbligatorio." });
    if (!dichiarazioneVeridicita || !assunzioneResponsabilita) return res.status(400).json({ error: "Dichiarazioni legali obbligatorie." });

    const activeComune = await getActiveComuneKeyServer();
    const prefix = activeComune.toUpperCase();
    const anno = new Date().getFullYear();
    
    let count = 0;
    if (getIsMysqlHealthy() && pool) {
      const [rows]: any = await pool.query("SELECT COUNT(*) as count FROM segnalazioni WHERE YEAR(created_at) = ?", [anno]);
      count = rows[0]?.count || 0;
    }
    
    const numero = String(count + 1).padStart(4, "0");
    const codiceTracking = `${prefix}-${anno}-${numero}`;

    const urgenza = (condizioni === "FERITO" || condizioni === "AGGRESSIVO") ? "ALTA" : "NORMALE";
    const fullName = `${nomeSegnalante} ${cognomeSegnalante}`.trim();
    const finalDesc = `${descrizione || ""}${telefonoSegnalante ? ` [Tel: ${telefonoSegnalante}]` : ""}`.trim();

    let sqlId = 0;
    if (getIsMysqlHealthy() && pool) {
        const [result]: any = await pool.execute(`
          INSERT INTO segnalazioni (
            comune_key, codice_tracking, specie, condizioni, descrizione, foto_url, 
            latitudine, longitudine, indirizzo, stato, urgenza, 
            email_segnalante, consenso_privacy, nome_segnalante
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          activeComune, codiceTracking, specie, condizioni, finalDesc, fotoUrl, 
          lat, lng, indirizzo, "CREATA", urgenza, emailSegnalante, 1, fullName
        ]);
        sqlId = result.insertId;
    }
    
    let firestoreId = sqlId.toString();

    if (db) {
      const docRef = await db.collection("segnalazioni").add({
        relationalId: sqlId,
        comuneKey: activeComune,
        codiceTracking,
        specie, condizioni,
        descrizione: finalDesc,
        fotoUrl, latitudine: lat, longitudine: lng,
        indirizzo, stato: "CREATA", urgenza,
        nomeSegnalante: fullName, emailSegnalante, telefonoSegnalante,
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

    if (getIsMysqlHealthy() && pool) {
        await pool.execute("UPDATE segnalazioni SET stato = ?, updated_at = NOW() WHERE codice_tracking = ?", [stato, codiceTracking]);
    }
    if (db) {
      const snapshot = await db.collection("segnalazioni").where("codiceTracking", "==", codiceTracking).get();
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.update(doc.ref, { stato, updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        await batch.commit();
      }
    }
    res.json({ success: true, codiceTracking, stato });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:codiceTracking/log", async (req, res) => {
  try {
    const { codiceTracking } = req.params;
    const { operatore, azione, note, nuovoStato } = req.body;

    if (!operatore || !azione) return res.status(400).json({ error: "Operatore e azione obbligatori" });

    const activeComune = await getActiveComuneKeyServer();

    if (getIsMysqlHealthy() && pool) {
        await pool.execute("INSERT INTO interventi_logs (comune_key, segnalazione_codice, operatore, azione, note) VALUES (?, ?, ?, ?, ?)",
          [activeComune, codiceTracking, operatore, azione, note || ""]);
        if (nuovoStato) {
          await pool.execute("UPDATE segnalazioni SET stato = ?, updated_at = NOW() WHERE codice_tracking = ?", [nuovoStato, codiceTracking]);
        }
    }

    let userEmail = null; let userName = "Cittadino";
    if (nuovoStato && db) {
      const snapshot = await db.collection("segnalazioni").where("codiceTracking", "==", codiceTracking).get();
      if (!snapshot.empty) {
        userEmail = snapshot.docs[0].data().emailSegnalante;
        userName = snapshot.docs[0].data().nomeSegnalante;
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.update(doc.ref, { stato: nuovoStato, updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        await batch.commit();
      }
    }

    if (userEmail) {
        // Mock notification logic here, real integration goes to Resend etc if key is provided.
        console.log(`Email to ${userEmail} triggered for ${codiceTracking}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/upload", async (req, res) => {
    try {
        const { name, base64 } = req.body;
        if (!base64) return res.status(400).json({ error: "Nessun dato immagine fornito." });
        
        const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, 'base64');
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        
        const fileExt = name ? (name.split('.').pop() || 'jpg') : 'jpg';
        const fileName = `${Date.now()}_${name ? name.replace(/[^a-zA-Z0-9]/g, '_') : 'image'}.${fileExt}`;
        await fs.promises.writeFile(path.join(uploadsDir, fileName), buffer);
        res.json({ url: `/uploads/${fileName}` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
