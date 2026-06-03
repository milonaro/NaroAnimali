import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import bcrypt from "bcryptjs";
import admin from "firebase-admin";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import mysql from "mysql2/promise";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy AI Initialization
let genAIInstance: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAIInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    genAIInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });
  }
  return genAIInstance;
}

// Lazy Resend Initialization
let resendInstance: Resend | null = null;
function getResend() {
  if (!resendInstance) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    resendInstance = new Resend(key);
  }
  return resendInstance;
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}");
    if (serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
  } catch (e) {
    console.error("Firebase Admin Init Error:", e);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

async function startServer() {
  // Setup Relational Database (MySQL or SQLite fallback)
  let mysqlPool: mysql.Pool | null = null;
  let sqliteDb: any = null;

  if (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER) {
    try {
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log("Connesso al database MySQL su Aruba");
    } catch (e) {
      console.error("Errore di connessione a MySQL, uso il fallback SQLite:", e);
    }
  }

  if (!mysqlPool) {
    sqliteDb = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    await sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS segnalazioni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codiceTracking TEXT,
        specie TEXT,
        condizioni TEXT,
        descrizione TEXT,
        fotoUrl TEXT,
        latitudine REAL,
        longitudine REAL,
        indirizzo TEXT,
        stato TEXT,
        urgenza TEXT,
        emailSegnalante TEXT,
        nomeSegnalante TEXT,
        consensoPrivacy INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Chat Route
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      const genAI = getGenAI();
      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: messages,
        config: {
          systemInstruction: "Sei un assistente specializzato nella normativa italiana di tutela animale per il Comune di Naro (AG) e la regione Sicilia. " +
            "Il sistema si chiama AnimalHub PA. " +
            "Rispondi in italiano in modo professionale ma accessibile. " +
            "Conosci le leggi regionali siciliane sul randagismo (L.R. 15/2000) e il benessere dei cani. " +
            "Se l'utente chiede come segnalare un animale, indirizzalo alla sezione 'Segnala' del portale. " +
            "In caso di emergenza (animali feriti gravemente o pericolo pubblico), invita sempre a contattare il 112 o il centralino della Polizia Municipale di Naro al numero 0922 956001."
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // OTP Route
  app.post("/api/auth/otp", async (req, res) => {
    try {
      const { email } = req.body;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(otp, salt);

      if (db) {
        await db.collection("otpTokens").add({
          email,
          token: hash,
          expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000)),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      const resend = getResend();
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: email,
        subject: "Il tuo codice di accesso - AnimalHub PA",
        html: `<h2>Il tuo codice OTP è: ${otp}</h2><p>Valido per 15 minuti.</p>`
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // OTP Verification
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!db) throw new Error("DB not connected");

      const snap = await db.collection("otpTokens")
        .where("email", "==", email)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (snap.empty) return res.status(400).json({ error: "Token non trovato" });

      const doc = snap.docs[0].data();
      const isValid = await bcrypt.compare(otp, doc.token);

      if (isValid && doc.expiresAt.toDate() > new Date()) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Token non valido o scaduto" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Segnalazioni Route
  app.get("/api/segnalazioni", async (req, res) => {
    try {
      let list = [];
      if (mysqlPool) {
        const [rows] = await mysqlPool.query<any>("SELECT * FROM segnalazioni ORDER BY created_at DESC");
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
        const rows = await sqliteDb.all("SELECT * FROM segnalazioni ORDER BY createdAt DESC");
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

  app.post("/api/segnalazioni", async (req, res) => {
    try {
      const { lat, lng, specie, condizioni, descrizione, emailSegnalante, consensoPrivacy, fotoUrl, indirizzo } = req.body;

      if (!consensoPrivacy) return res.status(400).json({ error: "Consenso privacy obbligatorio" });

      const anno = new Date().getFullYear();
      
      // We retrieve count from our relational DB
      let count = 0;
      if (mysqlPool) {
        const [rows] = await mysqlPool.query<any>("SELECT COUNT(*) as count FROM segnalazioni WHERE YEAR(created_at) = ?", [anno]);
        count = rows[0]?.count || 0;
      } else {
        const row = await sqliteDb.get("SELECT COUNT(*) as count FROM segnalazioni WHERE strftime('%Y', createdAt) = ?", [anno.toString()]);
        count = row?.count || 0;
      }
      
      const numero = String(count + 1).padStart(4, "0");
      const codiceTracking = `NARO-${anno}-${numero}`;

      const urgenza = (condizioni === "FERITO" || condizioni === "AGGRESSIVO") ? "ALTA" : "NORMALE";

      let sqlId = 0;

      // Insert primary data into Relational DB
      if (mysqlPool) {
        const [result] = await mysqlPool.execute<any>(`
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
        const insertResult = await sqliteDb.run(`
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

      // Sync realtime payload to Firestore (for map pins / real-time dashboard)
      if (db) {
        const docRef = await db.collection("segnalazioni").add({
          relationalId: sqlId, // Linking to primary DB
          codiceTracking,
          specie,
          condizioni,
          descrizione, // Note: For a strict "realtime only" Firestore, we could omit heavy fields like desc/email
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

  // Debug Database Config and Data
  app.get("/api/debug/db", async (req, res) => {
    try {
      let mysqlStatus = "Disconnesso";
      let mysqlError = null;
      let mysqlData = null;

      if (mysqlPool) {
        try {
          const [rows] = await mysqlPool.query("SELECT * FROM segnalazioni LIMIT 5");
          mysqlStatus = "Connesso (Aruba)";
          mysqlData = rows;
        } catch (err: any) {
          mysqlStatus = "Errore di connessione o query (Aruba)";
          mysqlError = err.message;
        }
      } else {
        mysqlStatus = "Fallback SQLite locale";
        if (sqliteDb) {
           const rows = await sqliteDb.all("SELECT * FROM segnalazioni LIMIT 5");
           mysqlData = rows;
        }
      }

      let firestoreStatus = "Disconnesso";
      let firestoreError = null;
      let firestoreData = null;

      if (db) {
        try {
          const snap = await db.collection("segnalazioni").limit(5).get();
          firestoreStatus = "Connesso";
          firestoreData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (err: any) {
          firestoreStatus = "Errore Firestore";
          firestoreError = err.message;
        }
      } else {
         firestoreStatus = "Firebase Admin non inizializzato";
      }

      res.json({
        mysql: {
          status: mysqlStatus,
          error: mysqlError,
          sampleData: mysqlData,
          config: {
            host: process.env.DB_HOST ? `${process.env.DB_HOST.substring(0, 4)}***` : "Non impostato",
            user: process.env.DB_USER ? `${process.env.DB_USER.substring(0, 3)}***` : "Non impostato",
            database: process.env.DB_NAME ? `${process.env.DB_NAME.substring(0, 3)}***` : "Non impostato",
          }
        },
        firestore: {
          status: firestoreStatus,
          error: firestoreError,
          sampleData: firestoreData,
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
