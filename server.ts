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
import mysqlPool from "./src/lib/mysql";
import segnalazioniRouter from "./src/pages/api/segnalazioni";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

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
  let sqliteDb: any = null;

  if (mysqlPool) {
    try {
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS admin_config (
          key_name VARCHAR(100) PRIMARY KEY,
          value_data TEXT
        )
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) UNIQUE,
          password_hash VARCHAR(255),
          role VARCHAR(50) DEFAULT 'admin'
        )
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS registro_anagrafica (
          id INT AUTO_INCREMENT PRIMARY KEY,
          microchip VARCHAR(50) UNIQUE,
          nome VARCHAR(100),
          specie VARCHAR(50),
          sesso VARCHAR(10),
          taglia VARCHAR(50),
          colore VARCHAR(100),
          condizioniSanitarie TEXT,
          stato VARCHAR(50),
          fotoUrl TEXT,
          dataRegistrazione DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS interventi_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          segnalazione_codice VARCHAR(100),
          operatore VARCHAR(100),
          azione TEXT,
          note TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {
      console.error("Errore table MySQL:", e);
    }
  } else {
    sqliteDb = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    await sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS admin_config (
        key_name TEXT PRIMARY KEY,
        value_data TEXT
      );
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password_hash TEXT,
        role TEXT DEFAULT 'admin'
      );
      CREATE TABLE IF NOT EXISTS registro_anagrafica (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        microchip TEXT UNIQUE,
        nome TEXT,
        specie TEXT,
        sesso TEXT,
        taglia TEXT,
        colore TEXT,
        condizioniSanitarie TEXT,
        stato TEXT,
        fotoUrl TEXT,
        dataRegistrazione DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS interventi_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        segnalazione_codice TEXT,
        operatore TEXT,
        azione TEXT,
        note TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
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
  app.use(cookieParser());

  // Insert default admin user if missing
  const defaultUsers = [
    { u: "admin", r: "Admin" },
    { u: "admin2", r: "Admin" },
    { u: "polizia1", r: "Polizia_Locale" },
    { u: "polizia2", r: "Polizia_Locale" },
    { u: "canile1", r: "Canile_Sanitario" },
    { u: "canile2", r: "Canile_Sanitario" },
    { u: "volo1", r: "Volontario" },
    { u: "volo2", r: "Volontario" },
  ];
  const defaultPass = await bcrypt.hash("admin2026", 10);
  
  if (mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.execute('SELECT count(*) as c FROM admin_users');
      if (rows[0].c < 8) {
        for (const usr of defaultUsers) {
          await mysqlPool.execute('INSERT IGNORE INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)', [usr.u, defaultPass, usr.r]);
        }
      }
    } catch(e) {}
  } else if (sqliteDb) {
    try {
      const row = await sqliteDb.get('SELECT count(*) as c FROM admin_users');
      if (row.c < 8) {
        for (const usr of defaultUsers) {
          await sqliteDb.run('INSERT OR IGNORE INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)', [usr.u, defaultPass, usr.r]);
        }
      }
    } catch(e) {}
  }

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

  // Admin Auth Routes
  const JWT_SECRET = process.env.JWT_SECRET || "animalhub_secure_secret_12345";
  
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      let user: any = null;

      if (mysqlPool) {
        const [rows]: any = await mysqlPool.execute("SELECT * FROM admin_users WHERE username = ?", [username]);
        user = rows[0];
      } else if (sqliteDb) {
        user = await sqliteDb.get("SELECT * FROM admin_users WHERE username = ?", [username]);
      }

      if (!user) return res.status(401).json({ error: "Credenziali non valide" });

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return res.status(401).json({ error: "Credenziali non valide" });

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
      
      res.cookie("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });

      res.json({ success: true, user: { username: user.username, role: user.role } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie("admin_token");
    res.json({ success: true });
  });

  app.get("/api/admin/me", (req, res) => {
    const token = req.cookies.admin_token;
    if (!token) return res.status(401).json({ error: "Non autorizzato" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({ user: decoded });
    } catch(e) {
      res.status(401).json({ error: "Token non valido" });
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

  // Setup Segnalazioni Router
  app.use("/api/segnalazioni", segnalazioniRouter);

  // Endpoint per GET e POST della configurazione admin
  app.get("/api/admin/config", async (req, res) => {
    try {
      let config: Record<string, string> = {};
      if (mysqlPool) {
        const [rows] = await mysqlPool.query<any>("SELECT * FROM admin_config");
        rows.forEach((r: any) => { config[r.key_name] = r.value_data; });
      } else {
        const rows = await sqliteDb.all("SELECT * FROM admin_config");
        rows.forEach((r: any) => { config[r.key_name] = r.value_data; });
      }
      res.json(config);
    } catch (error: any) {
      console.error("GET config error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/config", async (req, res) => {
    try {
      const token = req.cookies.admin_token;
      if (!token) return res.status(401).json({ error: "Non autorizzato" });
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== "Admin") {
        return res.status(403).json({ error: "Accesso negato. Solo il ruolo Admin può modificare la configurazione." });
      }

      const { siteName, siteLogo } = req.body;
      if (mysqlPool) {
        await mysqlPool.execute(
          "INSERT INTO admin_config (key_name, value_data) VALUES ('siteName', ?) ON DUPLICATE KEY UPDATE value_data = ?",
          [siteName || "Comune di Naro", siteName || "Comune di Naro"]
        );
        await mysqlPool.execute(
          "INSERT INTO admin_config (key_name, value_data) VALUES ('siteLogo', ?) ON DUPLICATE KEY UPDATE value_data = ?",
          [siteLogo || "", siteLogo || ""]
        );
      } else {
        await sqliteDb.run(
          "INSERT INTO admin_config (key_name, value_data) VALUES ('siteName', ?) ON CONFLICT(key_name) DO UPDATE SET value_data = ?",
          [siteName || "Comune di Naro", siteName || "Comune di Naro"]
        );
        await sqliteDb.run(
          "INSERT INTO admin_config (key_name, value_data) VALUES ('siteLogo', ?) ON CONFLICT(key_name) DO UPDATE SET value_data = ?",
          [siteLogo || "", siteLogo || ""]
        );
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("POST config error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/registro", async (req, res) => {
    try {
      let list = [];
      if (mysqlPool) {
        const [rows] = await mysqlPool.query<any>("SELECT * FROM registro_anagrafica ORDER BY dataRegistrazione DESC");
        list = rows;
      } else {
        const rows = await sqliteDb.all("SELECT * FROM registro_anagrafica ORDER BY dataRegistrazione DESC");
        list = rows;
      }
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/registro", async (req, res) => {
    try {
      const { microchip, nome, specie, sesso, taglia, colore, condizioniSanitarie, fotoUrl, stato } = req.body;
      let sqlId = 0;
      if (mysqlPool) {
        const [result] = await mysqlPool.execute<any>(`
          INSERT INTO registro_anagrafica (microchip, nome, specie, sesso, taglia, colore, condizioniSanitarie, stato, fotoUrl)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [microchip, nome, specie, sesso, taglia, colore, condizioniSanitarie, stato, fotoUrl]);
        sqlId = result.insertId;
      } else {
        const result = await sqliteDb.run(`
          INSERT INTO registro_anagrafica (microchip, nome, specie, sesso, taglia, colore, condizioniSanitarie, stato, fotoUrl)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [microchip, nome, specie, sesso, taglia, colore, condizioniSanitarie, stato, fotoUrl]);
        sqlId = result.lastID;
      }
      res.json({ success: true, id: sqlId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/registro/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { microchip, nome, specie, sesso, taglia, colore, condizioniSanitarie, fotoUrl, stato } = req.body;
      if (mysqlPool) {
        await mysqlPool.execute(`
          UPDATE registro_anagrafica 
          SET microchip=?, nome=?, specie=?, sesso=?, taglia=?, colore=?, condizioniSanitarie=?, stato=?, fotoUrl=?
          WHERE id=?
        `, [microchip, nome, specie, sesso, taglia, colore, condizioniSanitarie, stato, fotoUrl, id]);
      } else {
        await sqliteDb.run(`
          UPDATE registro_anagrafica 
          SET microchip=?, nome=?, specie=?, sesso=?, taglia=?, colore=?, condizioniSanitarie=?, stato=?, fotoUrl=?
          WHERE id=?
        `, [microchip, nome, specie, sesso, taglia, colore, condizioniSanitarie, stato, fotoUrl, id]);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/interventi_logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      let list = [];
      let totalCount = 0;

      if (mysqlPool) {
        const [countRows]: any = await mysqlPool.query("SELECT COUNT(*) as c FROM interventi_logs");
        totalCount = countRows[0]?.c || 0;

        const [rows] = await mysqlPool.query<any>(
          "SELECT id, segnalazione_codice as reportId, operatore, azione as descrizione, note as assegnatoA, timestamp as data FROM interventi_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?",
          [limit, offset]
        );
        list = rows;
      } else {
        const countRow = await sqliteDb.get("SELECT COUNT(*) as c FROM interventi_logs");
        totalCount = countRow?.c || 0;

        const rows = await sqliteDb.all(
          "SELECT id, segnalazione_codice as reportId, operatore, azione as descrizione, note as assegnatoA, timestamp as data FROM interventi_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?",
          [limit, offset]
        );
        list = rows;
      }

      res.json({
        data: list,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + list.length < totalCount
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
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
