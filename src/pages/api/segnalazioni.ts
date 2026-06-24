import express, { Router } from "express";
import pool, { getIsMysqlHealthy, setMysqlHealthy } from "../../lib/mysql.js";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let firestoreDatabaseId: string | undefined = undefined;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    firestoreDatabaseId = config.firestoreDatabaseId;
    if (config.firebaseProjectId && admin.apps.length === 0) {
      admin.initializeApp({ projectId: config.firebaseProjectId });
    }
  } else if (process.env.FIREBASE_PROJECT_ID && admin.apps.length === 0) {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  }
} catch (e) {
  console.error("Error reading firebase-applet-config.json in API:", e);
}

if (admin.apps.length === 0) {
   try { admin.initializeApp({ projectId: "demo-animalhub" }); } catch(e) {}
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

    // FULLSTACK CYBER-SECURITY CONTROL: anti-clutter duplicate detection
    if (getIsMysqlHealthy() && pool) {
      try {
        const [recentRows]: any = await pool.query(
          "SELECT * FROM segnalazioni WHERE comune_key = ? AND specie = ? AND stato != 'CHIUSA' AND created_at >= NOW() - INTERVAL 2 HOUR",
          [activeComune, specie]
        );
        
        const possibleDuplicate = recentRows.find((item: any) => {
          const itemLat = parseFloat(item.latitudine);
          const itemLng = parseFloat(item.longitudine);
          const targetLat = parseFloat(lat);
          const targetLng = parseFloat(lng);
          const dist = Math.abs(itemLat - targetLat) + Math.abs(itemLng - targetLng);
          return dist < 0.005 || (indirizzo && item.indirizzo && item.indirizzo.toLowerCase() === indirizzo.toLowerCase());
        });

        if (possibleDuplicate) {
          return res.status(400).json({
            error: `Una segnalazione per un soggetto di tipo '${specie}' nello stesso raggio o luogo è già presente ed è attiva (Codice: ${possibleDuplicate.codice_tracking}, Stato: ${possibleDuplicate.stato}). Il Comune, la Polizia Locale e i veterinari associati sono già stati allertati e l'intervento si trova in fase di coordinamento. Per inviare materiale fotografico aggiuntivo o cooperare all'intervento, contatta l'assistenza citando il codice ${possibleDuplicate.codice_tracking}, evitando di reinviare lo stesso record.`,
            duplicateReportDetected: true,
            duplicateCode: possibleDuplicate.codice_tracking
          });
        }
      } catch (err: any) {
        console.warn("Info controllo duplicati segnalazione:", err.message);
      }
    }

    const prefix = activeComune.toUpperCase();
    const anno = new Date().getFullYear();
    
    let count = 0;
    if (getIsMysqlHealthy() && pool) {
      const [rows]: any = await pool.query("SELECT COUNT(*) as count FROM segnalazioni WHERE YEAR(created_at) = ?", [anno]);
      count = rows[0]?.count || 0;
    }
    
    let numero = String(count + 1).padStart(4, "0");
    let codiceTracking = `${prefix}-${anno}-${numero}`;

    // Guarantee uniqueness
    let isUnique = false;
    let attempts = 0;
    if (getIsMysqlHealthy() && pool) {
      while (!isUnique && attempts < 50) {
        const [existing]: any = await pool.query("SELECT id FROM segnalazioni WHERE codice_tracking = ?", [codiceTracking]);
        if (existing && existing.length > 0) {
          count++;
          numero = String(count + 1).padStart(4, "0");
          codiceTracking = `${prefix}-${anno}-${numero}`;
          attempts++;
        } else {
          isUnique = true;
        }
      }
    }

    const urgenza = (condizioni === "FERITO" || condizioni === "AGGRESSIVO") ? "ALTA" : "NORMALE";
    const fullName = `${nomeSegnalante} ${cognomeSegnalante}`.trim();
    const finalDesc = `${descrizione || ""}${telefonoSegnalante ? ` [Tel: ${telefonoSegnalante}]` : ""}`.trim();

    let sqlId = 0;
    if (getIsMysqlHealthy() && pool) {
        try {
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

          // Log report submission
          const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
          const ip = ipHeader.substring(0, 45);
          const userAgent = (req.headers['user-agent'] || '').substring(0, 255);
          await pool.execute(
            "INSERT INTO citizen_access_logs (email, ip_address, user_agent, azione) VALUES (?, ?, ?, ?)",
            [emailSegnalante, ip, userAgent, 'INOLTRO_SEGNALAZIONE']
          );
        } catch (dbErr: any) {
          console.error("MySQL Insert error:", dbErr.message);
          setMysqlHealthy(false);
        }
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
        try {
          await pool.execute("UPDATE segnalazioni SET stato = ?, updated_at = NOW() WHERE codice_tracking = ?", [stato, codiceTracking]);
        } catch(e: any) {
          console.error("MySQL update stato error:", e.message);
          setMysqlHealthy(false);
        }
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
        try {
          await pool.execute("INSERT INTO interventi_logs (comune_key, segnalazione_codice, operatore, azione, note) VALUES (?, ?, ?, ?, ?)",
            [activeComune, codiceTracking, operatore, azione, note || ""]);
          if (nuovoStato) {
            await pool.execute("UPDATE segnalazioni SET stato = ?, updated_at = NOW() WHERE codice_tracking = ?", [nuovoStato, codiceTracking]);
          }
        } catch(e: any) {
          console.error("MySQL log error:", e.message);
          setMysqlHealthy(false);
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

router.get("/:codiceTracking/logs", async (req, res) => {
  try {
    const { codiceTracking } = req.params;
    let list = [];
    if (getIsMysqlHealthy() && pool) {
      const [rows]: any = await pool.query(
        "SELECT * FROM interventi_logs WHERE segnalazione_codice = ? ORDER BY timestamp DESC",
        [codiceTracking]
      );
      list = rows;
    }
    res.json(list);
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
        
        try {
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
            
            const fileExt = name ? (name.split('.').pop() || 'jpg') : 'jpg';
            const fileName = `${Date.now()}_${name ? name.replace(/[^a-zA-Z0-9]/g, '_') : 'image'}.${fileExt}`;
            await fs.promises.writeFile(path.join(uploadsDir, fileName), buffer);
            return res.json({ url: `/uploads/${fileName}` });
        } catch (writeError: any) {
            console.warn("[Upload Resiliency Fallback] Scrittura locale su disco non consentita o fallita (ambiente serverless o di sola lettura):", writeError.message);
            // Fallback: return direct base64 data URL which renders perfectly in any browser
            const finalBase64 = base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}`;
            return res.json({ url: finalBase64 });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
