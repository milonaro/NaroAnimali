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
  // Setup Relational Database (SQLite to mimic MySQL)
  const sqliteDb = await open({
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
            "Il sistema si chiama NaroAnimali. " +
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
        subject: "Il tuo codice di accesso - NaroAnimali",
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
      if (!db) {
        return res.json([]);
      }
      const snap = await db.collection("segnalazioni")
        .orderBy("createdAt", "desc")
        .get();
      
      const list = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? data.createdAt.toDate().toLocaleDateString("it-IT") : new Date().toLocaleDateString("it-IT"),
          updatedAt: data.updatedAt ? data.updatedAt.toDate().toLocaleDateString("it-IT") : new Date().toLocaleDateString("it-IT"),
        };
      });
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
      if (!db) throw new Error("DB not connected");

      const anno = new Date().getFullYear();
      
      // We retrieve count from our relational DB
      const { count } = await sqliteDb.get("SELECT COUNT(*) as count FROM segnalazioni WHERE strftime('%Y', createdAt) = ?", [anno.toString()]);
      
      const numero = String((count || 0) + 1).padStart(4, "0");
      const codiceTracking = `NARO-${anno}-${numero}`;

      const urgenza = (condizioni === "FERITO" || condizioni === "AGGRESSIVO") ? "ALTA" : "NORMALE";

      // Insert primary data into Relational DB (simulating MySQL full dataset)
      const insertResult = await sqliteDb.run(`
        INSERT INTO segnalazioni (
          codiceTracking, specie, condizioni, descrizione, fotoUrl, 
          latitudine, longitudine, indirizzo, stato, urgenza, 
          emailSegnalante, consensoPrivacy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        codiceTracking, specie, condizioni, descrizione, fotoUrl, 
        lat, lng, indirizzo, "NUOVA", urgenza, 
        emailSegnalante || null, consensoPrivacy ? 1 : 0
      ]);

      const sqlId = insertResult.lastID;

      // Sync realtime payload to Firestore (for map pins / real-time dashboard)
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
        stato: "NUOVA",
        urgenza,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ id: docRef.id, codiceTracking });
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
