import { Router } from "express";
import pool from "../../lib/mysql";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import admin from "firebase-admin";

const router = Router();
const db = admin.apps.length ? admin.firestore() : null;

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

router.get("/", async (req, res) => {
  try {
    let list = [];
    if (pool) {
      const [rows] = await pool.query<any>("SELECT * FROM segnalazioni ORDER BY created_at DESC");
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
    } else {
      const dbSq = await getSqliteDb();
      const rows = await dbSq.all("SELECT * FROM segnalazioni ORDER BY createdAt DESC");
      list = rows.map((r: any) => ({
        id: r.id.toString(),
        codiceTracking: r.codiceTracking,
        specie: r.specie,
        condizioni: r.condizioni,
        descrizione: r.descrizione,
        fotoUrl: r.fotoUrl,
        latitudine: r.latitudine,
        longitudine: r.longitudine,
        indirizzo: r.indirizzo,
        stato: r.stato,
        urgenza: r.urgenza,
        createdAt: r.createdAt || new Date().toISOString(),
        updatedAt: r.updatedAt || new Date().toISOString()
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
    const { lat, lng, specie, condizioni, descrizione, emailSegnalante, consensoPrivacy, fotoUrl, indirizzo } = req.body;

    if (!consensoPrivacy) return res.status(400).json({ error: "Consenso privacy obbligatorio" });

    const anno = new Date().getFullYear();
    
    let count = 0;
    if (pool) {
      const [rows] = await pool.query<any>("SELECT COUNT(*) as count FROM segnalazioni WHERE YEAR(created_at) = ?", [anno]);
      count = rows[0]?.count || 0;
    } else {
      const dbSq = await getSqliteDb();
      const row = await dbSq.get("SELECT COUNT(*) as count FROM segnalazioni WHERE strftime('%Y', createdAt) = ?", [anno.toString()]);
      count = row?.count || 0;
    }
    
    const numero = String(count + 1).padStart(4, "0");
    const codiceTracking = `NARO-${anno}-${numero}`;

    const urgenza = (condizioni === "FERITO" || condizioni === "AGGRESSIVO") ? "ALTA" : "NORMALE";

    let sqlId = 0;

    if (pool) {
      const [result] = await pool.execute<any>(`
        INSERT INTO segnalazioni (
          codice_tracking, specie, condizioni, descrizione, foto_url, 
          latitudine, longitudine, indirizzo, stato, urgenza, 
          email_segnalante, consenso_privacy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        codiceTracking, specie, condizioni, descrizione, fotoUrl, 
        lat, lng, indirizzo, "CREATA", urgenza, 
        emailSegnalante || null, consensoPrivacy ? 1 : 0
      ]);
      sqlId = result.insertId;
    } else {
      const dbSq = await getSqliteDb();
      const insertResult = await dbSq.run(`
        INSERT INTO segnalazioni (
          codiceTracking, specie, condizioni, descrizione, fotoUrl, 
          latitudine, longitudine, indirizzo, stato, urgenza, 
          emailSegnalante, consensoPrivacy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        codiceTracking, specie, condizioni, descrizione, fotoUrl, 
        lat, lng, indirizzo, "CREATA", urgenza, 
        emailSegnalante || null, consensoPrivacy ? 1 : 0
      ]);
      sqlId = insertResult.lastID;
    }

    let firestoreId = sqlId.toString();

    if (db) {
      const docRef = await db.collection("segnalazioni").add({
        relationalId: sqlId,
        codiceTracking,
        specie,
        condizioni,
        descrizione,
        fotoUrl,
        latitudine: lat,
        longitudine: lng,
        indirizzo,
        stato: "CREATA",
        urgenza,
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

export default router;
