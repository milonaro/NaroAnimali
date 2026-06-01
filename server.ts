import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import bcrypt from "bcryptjs";
import admin from "firebase-admin";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize AI
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } }
});

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Chat Route
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
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
  app.post("/api/segnalazioni", async (req, res) => {
    try {
      const { lat, lng, specie, condizioni, descrizione, emailSegnalante, consensoPrivacy, fotoUrl, indirizzo } = req.body;

      if (!consensoPrivacy) return res.status(400).json({ error: "Consenso privacy obbligatorio" });
      if (!db) throw new Error("DB not connected");

      const anno = new Date().getFullYear();
      const countSnap = await db.collection("segnalazioni")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(new Date(`${anno}-01-01`)))
        .count()
        .get();
      
      const numero = String(countSnap.data().count + 1).padStart(4, "0");
      const codiceTracking = `NARO-${anno}-${numero}`;

      const docRef = await db.collection("segnalazioni").add({
        codiceTracking,
        specie,
        condizioni,
        descrizione,
        fotoUrl,
        latitudine: lat,
        longitudine: lng,
        indirizzo,
        stato: "NUOVA",
        urgenza: (condizioni === "FERITO" || condizioni === "AGGRESSIVO") ? "ALTA" : "NORMALE",
        emailSegnalante: emailSegnalante || null,
        consensoPrivacy,
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
