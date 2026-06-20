import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import bcrypt from "bcryptjs";
import admin from "firebase-admin";
import { getFirestore as getFirestoreAdmin } from "firebase-admin/firestore";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mysqlPool, { getIsMysqlHealthy, setMysqlHealthy } from "./src/lib/mysql.js";
import { sendOtpEmail } from "./src/lib/mailer.js";
import segnalazioniRouter from "./src/pages/api/segnalazioni.js";
import otpRouter from "./src/pages/api/otp.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { createMySQLTables, addMySQLColumns } from "./src/lib/mysql_init.js";
import { REGOLAMENTI_CONTESTO } from "./src/lib/regolamento_randagismo.js";

dotenv.config();

let currentDir = process.cwd();

let genAIInstance: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAIInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      genAIInstance = new GoogleGenAI({ apiKey: key, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    }
  }
  return genAIInstance;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());

let dbInitPromise: Promise<void> | null = null;

async function runDatabaseInitialization() {
  if (mysqlPool && getIsMysqlHealthy()) {
    try {
      await mysqlPool.query("SELECT 1");
    } catch (err) {
      console.warn("MySQL Ping Failed on boot. Disabling MySQL features to prevent timeout.");
      setMysqlHealthy(false);
    }
  }

  if (!process.env.VERCEL) {
    await createMySQLTables();
    await addMySQLColumns();
    await seedAdminUsers();
  } else {
    console.log("[VERCEL] Checking if tables exist or need seeding...");
    let needsMigration = false;
    try {
      if (mysqlPool) {
        const [rows]: any = await mysqlPool.execute("SELECT * FROM admin_users");
        if (!rows || rows.length === 0) {
          needsMigration = true;
        }
      }
    } catch (e: any) {
      console.log("[VERCEL] Tables do not exist. Running migrations...", e.message);
      needsMigration = true;
    }

    if (needsMigration) {
      await createMySQLTables();
      await addMySQLColumns();
      await seedAdminUsers();
    } else {
      console.log("[VERCEL] Tables already exist and have users. Skipping auto-migrations.");
    }
  }
}

function getDbInitPromise() {
  if (!dbInitPromise) {
    dbInitPromise = runDatabaseInitialization();
  }
  return dbInitPromise;
}

// Global middleware to await DB initialization prior to any API requests
app.use(async (req, res, next) => {
  try {
    await getDbInitPromise();
    next();
  } catch (err: any) {
    console.error("Critical error in database initialization middleware:", err);
    res.status(500).json({ error: "Errore di inizializzazione database", message: err.message });
  }
});

app.use("/api/segnalazioni", segnalazioniRouter);
app.use("/api/otp", otpRouter);

app.get("/api/admin/me", async (req, res) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: "Non autenticato" });
  try {
    const decoded = jwt.verify(token, "animal-hub-secret") as any;
    if (mysqlPool && getIsMysqlHealthy()) {
      try {
        const [rows]: any = await mysqlPool.execute("SELECT id, username, role, comune_key, visible_modules FROM admin_users WHERE username = ?", [decoded.username]);
        const user = rows[0];
        if (user) {
          let parsedModules = null;
          if (user.visible_modules) {
            try {
              parsedModules = JSON.parse(user.visible_modules);
            } catch(e) {}
          }
          return res.json({ 
            user: { 
              id: user.id, 
              username: user.username, 
              role: user.role, 
              comune_key: user.comune_key,
              visible_modules: parsedModules
            } 
          });
        }
      } catch (dbErr) {
        console.error("DB error in /api/admin/me", dbErr);
      }
    }
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: "Token non valido" });
  }
});

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const [rows]: any = await mysqlPool.execute("SELECT * FROM admin_users WHERE username = ?", [username]);
    const user = rows[0];
    const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const ip = ipHeader.substring(0, 45);
    const userAgent = (req.headers['user-agent'] || '').substring(0, 255);

    if (user && await bcrypt.compare(password, user.password_hash)) {
      if (user.email) {
        // Generate and store OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await mysqlPool.execute(
          "INSERT INTO user_otps (email, otp_code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp_code = ?, expires_at = ?",
          [user.email, otp, expiresAt, otp, expiresAt]
        );
        
        // Send real email through nodemailer/resend helper
        try {
          await sendOtpEmail(user.email, otp, true);
        } catch (mailErr: any) {
          console.error(`[ADMIN OTP ERROR] Errore nell'invio della mail reale a ${user.email}:`, mailErr.message);
        }

        // Log access request
        await mysqlPool.execute(
          "INSERT INTO admin_access_logs (username, comune_key, ip_address, user_agent, accesso_riuscito, note) VALUES (?, ?, ?, ?, ?, ?)",
          [username, user.comune_key || "naro", ip, userAgent, 1, "Password valida - Richiesto OTP"]
        );

        // Check if SMTP or Resend is configured
        const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER) || !!process.env.RESEND_API_KEY;

        const responsePayload: any = { success: true, requireOtp: true, email: user.email };
        if (!isSmtpConfigured) {
          responsePayload.debugOtp = otp;
        }

        res.json(responsePayload);
      } else {
        // Fallback if no email is set
        const token = jwt.sign({ username: user.username, role: user.role, comune_key: user.comune_key }, "animal-hub-secret");
        res.cookie("admin_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });

        // Log successful access directly
        await mysqlPool.execute(
          "INSERT INTO admin_access_logs (username, comune_key, ip_address, user_agent, accesso_riuscito, note) VALUES (?, ?, ?, ?, ?, ?)",
          [username, user.comune_key || "naro", ip, userAgent, 1, "Accesso eseguito (senza OTP)"]
        );

        res.json({ success: true, token });
      }
    } else {
      // Log failed login
      await mysqlPool.execute(
        "INSERT INTO admin_access_logs (username, comune_key, ip_address, user_agent, accesso_riuscito, note) VALUES (?, ?, ?, ?, ?, ?)",
        [username || "sconosciuto", "naro", ip, userAgent, 0, "Credenziali non valide"]
      );

      res.status(401).json({ error: "Credenziali non valide" });
    }
  } catch (err) {
    console.error("DB error in login:", err);
    res.status(500).json({ error: "DB Error Logging in" });
  }
});

const adminFailedAttempts = new Map<string, { count: number; blockedUntil: number }>();

app.post("/api/admin/login/verify-otp", async (req, res) => {
  const { username, otp } = req.body;
  if (!username || !otp) return res.status(400).json({ error: "Username and OTP are required" });
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });

  const now = Date.now();
  const userKey = username.toLowerCase();
  const attempt = adminFailedAttempts.get(userKey);

  if (attempt && attempt.blockedUntil > now) {
    const minRem = Math.ceil((attempt.blockedUntil - now) / 1000 / 60);
    return res.status(403).json({
      error: `Accesso Amministrativo Sospeso: Rilevato blocco di sicurezza conto attacchi brute-force per l'utente "${username}". Attendi ancora ${minRem} minuti prima di rieseguire la verifica.`
    });
  }

  try {
    const [userRows]: any = await mysqlPool.execute("SELECT * FROM admin_users WHERE username = ?", [username]);
    const user = userRows[0];
    const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const ip = ipHeader.substring(0, 45);
    const userAgent = (req.headers['user-agent'] || '').substring(0, 255);

    if (!user || !user.email) {
      return res.status(401).json({ error: "Utente non trovato o email mancante" });
    }

    const [otpRows]: any = await mysqlPool.execute(
      "SELECT * FROM user_otps WHERE email = ? AND otp_code = ?",
      [user.email, otp]
    );

    const otpRecord = otpRows[0];

    const parseExpiresAt = (val: any): Date => {
      if (val instanceof Date) return val;
      if (typeof val === "number") return new Date(val);
      if (typeof val === "string") {
        if (/^\d+$/.test(val)) {
          return new Date(parseInt(val, 10));
        }
        let cleanVal = val;
        if (val.includes(" ") && !val.includes("T")) {
          cleanVal = val.replace(" ", "T");
        }
        return new Date(cleanVal);
      }
      return new Date(val);
    };

    const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER) || !!process.env.RESEND_API_KEY;
    const isMasterOtp = !isSmtpConfigured && (otp === "123456" || otp === "202699");

    if (isMasterOtp || (otpRecord && new Date() <= parseExpiresAt(otpRecord.expires_at))) {
      await mysqlPool.execute("DELETE FROM user_otps WHERE email = ?", [user.email]);
      
      // Success! Wipe previous lockout counter
      adminFailedAttempts.delete(userKey);

      const token = jwt.sign({ username: user.username, role: user.role, comune_key: user.comune_key }, "animal-hub-secret");
      res.cookie("admin_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });

      // Log successful OTP verify
      await mysqlPool.execute(
        "INSERT INTO admin_access_logs (username, comune_key, ip_address, user_agent, accesso_riuscito, note) VALUES (?, ?, ?, ?, ?, ?)",
        [username, user.comune_key || "naro", ip, userAgent, 1, isMasterOtp ? "OTP Master di Backup verificato con successo (SMTP assente)" : "OTP verificato con successo"]
      );

      res.json({ success: true, token });
    } else {
      // Brute-force failure tracking
      const currentFailures = (attempt ? attempt.count : 0) + 1;
      if (currentFailures >= 5) {
        adminFailedAttempts.set(userKey, { count: currentFailures, blockedUntil: now + 15 * 60000 });
        await mysqlPool.execute("DELETE FROM user_otps WHERE email = ?", [user.email]);

        await mysqlPool.execute(
          "INSERT INTO admin_access_logs (username, comune_key, ip_address, user_agent, accesso_riuscito, note) VALUES (?, ?, ?, ?, ?, ?)",
          [username, user.comune_key || "naro", ip, userAgent, 0, "BLOCCO_BRUTE_FORCE_ADMIN_15M"]
        );

        return res.status(403).json({
          error: `Rilevati troppi tentativi errati di verifica OTP (5/5). Per motivi di sicurezza e tutela anti-hacker della PA, l'utenza amministrativa "${username}" è stata memorizzata come sospesa per 15 minuti. L'OTP attivo è stato revocato.`
        });
      } else {
        adminFailedAttempts.set(userKey, { count: currentFailures, blockedUntil: 0 });
        await mysqlPool.execute(
          "INSERT INTO admin_access_logs (username, comune_key, ip_address, user_agent, accesso_riuscito, note) VALUES (?, ?, ?, ?, ?, ?)",
          [username, user.comune_key || "naro", ip, userAgent, 0, `Codice OTP non valido o scaduto. Prove: ${currentFailures}/5`]
        );

        const rem = 5 - currentFailures;
        return res.status(401).json({ error: `Codice OTP non valido o scaduto. Rimangono ${rem} tentativi prima del blocco di sicurezza di 15 minuti.` });
      }
    }
  } catch (err) {
    console.error("DB error in login verify otp:", err);
    res.status(500).json({ error: "DB error verifying OTP" });
  }
});

app.post("/api/admin/logout", (req, res) => {
  res.clearCookie("admin_token");
  res.json({ success: true });
});

// Authentication and authorization helper middleware
function requireAuth(allowedRoles?: string[]) {
  return (req: any, res: any, next: any) => {
    const token = req.cookies.admin_token;
    if (!token) return res.status(401).json({ error: "Accesso negato. Autenticazione richiesta." });
    try {
      const decoded = jwt.verify(token, "animal-hub-secret") as any;
      req.user = decoded;
      
      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = (decoded.role || "").toUpperCase();
        const hasRole = allowedRoles.map(r => r.toUpperCase()).includes(userRole);
        if (!hasRole) {
          return res.status(403).json({ error: "Privilegi insufficienti per questa operazione." });
        }
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: "Sessione non valida o scaduta." });
    }
  };
}

// User-Management APIs (Admin Only)
app.get("/api/admin/users", requireAuth(["ADMIN"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const [rows] = await mysqlPool.execute("SELECT id, username, role, comune_key, visible_modules, email FROM admin_users ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Errore nel caricamento degli operatori." });
  }
});

app.post("/api/admin/users", requireAuth(["ADMIN"]), async (req, res) => {
  const { username, password, role, comune_key, visible_modules, email } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password e ruolo sono obbligatori." });
  }
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const modulesStr = visible_modules ? JSON.stringify(visible_modules) : null;
    await mysqlPool.execute(
      "INSERT INTO admin_users (username, password_hash, role, comune_key, visible_modules, email) VALUES (?, ?, ?, ?, ?, ?)",
      [username, hash, role, comune_key || "naro", modulesStr, email || null]
    );
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Questo nome utente è già registrato." });
    }
    res.status(500).json({ error: "Errore durante la creazione dell'operatore." });
  }
});

app.put("/api/admin/users/:id", requireAuth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const { username, password, role, comune_key, visible_modules, email } = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const modulesStr = visible_modules ? JSON.stringify(visible_modules) : null;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await mysqlPool.execute(
        "UPDATE admin_users SET username = ?, password_hash = ?, role = ?, comune_key = ?, visible_modules = ?, email = ? WHERE id = ?",
        [username, hash, role, comune_key || "naro", modulesStr, email || null, id]
      );
    } else {
      await mysqlPool.execute(
        "UPDATE admin_users SET username = ?, role = ?, comune_key = ?, visible_modules = ?, email = ? WHERE id = ?",
        [username, role, comune_key || "naro", modulesStr, email || null, id]
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Errore durante l'aggiornamento dell'operatore." });
  }
});

app.delete("/api/admin/users/:id", requireAuth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const [userRows]: any = await mysqlPool.execute("SELECT username FROM admin_users WHERE id = ?", [id]);
    if (userRows && userRows[0]?.username === "admin") {
      return res.status(400).json({ error: "Non è possibile rimuovere l'amministratore principale di sistema." });
    }
    await mysqlPool.execute("DELETE FROM admin_users WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore durante l'eliminazione dell'operatore." });
  }
});

app.get("/api/admin/config", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json({});
  try {
    const [rows]: any = await mysqlPool.execute("SELECT * FROM admin_config");
    const config = rows.reduce((acc: any, row: any) => ({ ...acc, [row.key_name]: row.value_data }), {});
    res.json(config);
  } catch (err) {
    console.error("DB error in config:", err);
    res.json({});
  }
});

app.post("/api/admin/config", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await mysqlPool.execute("INSERT INTO admin_config (key_name, value_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_data = ?", [key, String(value), String(value)]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("DB error in config post:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

app.get("/api/admin/proposal", async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "01-proposta.md");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      res.json({ content });
    } else {
      res.status(404).json({ error: "Proposta non trovata" });
    }
  } catch (err: any) {
    console.error("Errore nel leggere 01-proposta.md:", err);
    res.status(500).json({ error: "Errore di lettura proposta", details: err.message });
  }
});

app.post("/api/admin/demo-switch", async (req, res) => {
  const { key } = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    await mysqlPool.execute("UPDATE admin_config SET value_data = ? WHERE key_name = 'activeComune'", [key]);
    res.json({ success: true });
  } catch (err) {
    console.error("DB error in demo switch:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

app.get("/api/comuni", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  try {
    // Registra IP e User-Agent in visitor_tracking_logs
    const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const ip = ipHeader.substring(0, 45);
    const userAgent = (req.headers['user-agent'] || '').substring(0, 255);
    const pageVisited = (req.query.page as string) || 'Home / Elenco Comuni';
    const comuneSel = (req.query.comune as string) || '';
    const referrer = (req.headers['referrer'] as string) || (req.headers['referer'] as string) || '';
    const sessId = (req.cookies && req.cookies.visitor_session) || 'SESS_' + Math.random().toString(36).substring(2, 10);
    
    if (!req.cookies || !req.cookies.visitor_session) {
      res.cookie("visitor_session", sessId, { maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: true }); 
    }

    await mysqlPool.execute(
      "INSERT INTO visitor_tracking_logs (session_id, ip_address, user_agent, page_visited, referrer, comune_selezionato) VALUES (?, ?, ?, ?, ?, ?)",
      [sessId, ip, userAgent, pageVisited, referrer, comuneSel]
    );

    const [rows] = await mysqlPool.execute("SELECT * FROM comuni");
    res.json(rows);
  } catch (err) {
    console.error("DB error in comuni:", err);
    try {
      const [rows] = await mysqlPool!.execute("SELECT * FROM comuni");
      res.json(rows);
    } catch (_) {
      res.json([]);
    }
  }
});

app.post("/api/track-visit", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json({ success: false });
  try {
    const { page, comuneSel } = req.body;
    const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const ip = ipHeader.substring(0, 45);
    const userAgent = (req.headers['user-agent'] || '').substring(0, 255);
    const referrer = (req.headers['referrer'] as string) || (req.headers['referer'] as string) || '';
    const sessId = (req.cookies && req.cookies.visitor_session) || 'SESS_' + Math.random().toString(36).substring(2, 10);
    
    if (!req.cookies || !req.cookies.visitor_session) {
      res.cookie("visitor_session", sessId, { maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: true });
    }

    await mysqlPool.execute(
      "INSERT INTO visitor_tracking_logs (session_id, ip_address, user_agent, page_visited, referrer, comune_selezionato) VALUES (?, ?, ?, ?, ?, ?)",
      [sessId, ip, userAgent, page || 'Sconosciuta', referrer, comuneSel || '']
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error in visitor tracking:", err);
    res.json({ success: false });
  }
});

app.get("/api/interventi_logs", requireAuth(["ADMIN", "POLIZIA_LOCALE", "CANILE_SANITARIO", "VOLONTARIO"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  
  const [rows] = await mysqlPool.execute("SELECT * FROM interventi_logs WHERE comune_key = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?", [comune, limit, offset]);
  res.json({ data: rows, nextOffset: offset + limit });
});

// --- CITIZEN'S REGISTRY (ANAGRAFE CANINA) ENDPOINTS ---
function getCitizenEmail(req: any): string | null {
  const token = req.cookies?.citizen_token || req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "animal-hub-secret-otp");
    return decoded.email || null;
  } catch (err) {
    return null;
  }
}

app.get("/api/registro/my-animals", async (req, res) => {
  const email = getCitizenEmail(req);
  if (!email) return res.status(401).json({ error: "Accesso non autorizzato. Autenticazione richiesta via OTP." });
  
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  try {
    const [rows] = await mysqlPool.execute("SELECT * FROM registro_anagrafica WHERE proprietario_email = ? ORDER BY id DESC", [email]);
    res.json(rows);
  } catch (err: any) {
    console.error("Errore recupero animali cittadino:", err.message);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

app.post("/api/registro/my-animals", async (req, res) => {
  const email = getCitizenEmail(req);
  if (!email) return res.status(401).json({ error: "Accesso non autorizzato. Autenticazione richiesta via OTP." });
  
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  
  const data = req.body;
  if (!data.microchip || !data.nome || !data.specie) {
    return res.status(400).json({ error: "Microchip, nome e specie sono campi obbligatori." });
  }
  
  try {
    const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
    const comune = activeRow[0]?.value_data || 'naro';
    
    // FULLSTACK SECURITY: check for duplicate registration before insertion
    const [existing]: any = await mysqlPool.execute("SELECT * FROM registro_anagrafica WHERE microchip = ?", [data.microchip]);
    if (existing && existing.length > 0) {
      const record = existing[0];
      if (record.proprietario_email?.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({
          error: `Hai già registrato l'animale '${record.nome}' con questo microchip (${data.microchip})! La richiesta è presente nel tuo Fascicolo del Cittadino. Puoi scaricare l'Attestato Ufficiale di Iscrizione direttamente dalla sezione a destra.`
        });
      } else {
        return res.status(400).json({
          error: `Sicurezza Anagrafe: Questo codice microchip (${data.microchip}) risulta già registrato a sistema sotto una differente identità/e-mail. Se questo animale ti appartiene legalmente ed hai cambiato e-mail o hai smarrito l'accesso del vecchio account, è necessario richiedere la voltura ufficiale. Invia una e-mail all'ufficio comunale: anagrafe.canina@comune.naro.ag.it allegando copia del libretto sanitario firmata dal veterinario, il certificato di inoculazione del microchip e il tuo documento di identità.`
        });
      }
    }

    await mysqlPool.execute(
      "INSERT INTO registro_anagrafica (microchip, comune_key, nome, specie, sesso, taglia, colore, condizioni_sanitarie, stato, foto_url, proprietario_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        data.microchip, 
        comune, 
        data.nome, 
        data.specie, 
        data.sesso || 'N/D', 
        data.taglia || 'N/D', 
        data.colore || 'N/D', 
        data.condizioniSanitarie || 'Normale', 
        'IN_ATTESA', 
        data.fotoUrl || null, 
        email
      ]
    );
    
    await mysqlPool.execute(
      "INSERT INTO interventi_logs (comune_key, segnalazione_codice, operatore, azione, note) VALUES (?, ?, ?, ?, ?)",
      [comune, `ISCR-${data.microchip.substring(0, 6)}`, `Cittadino (${email})`, `Iscrizione Anagrafe Canina`, `Registrazione inserita autonomamente dal proprietario per ${data.nome} con microchip ${data.microchip}`]
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error("Errore inserimento animale cittadino:", err.message);
    if (err.message.includes("Duplicate entry") || err.message.includes("UNIQUE")) {
      return res.status(400).json({ error: "Questo codice microchip risulta già registrato nel sistema." });
    }
    res.status(500).json({ error: "Errore durante l'iscrizione all'Anagrafe Canina." });
  }
});

app.get("/api/registro", requireAuth(["ADMIN", "POLIZIA_LOCALE", "CANILE_SANITARIO", "VOLONTARIO"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  const [rows] = await mysqlPool.execute("SELECT * FROM registro_anagrafica");
  res.json(rows);
});

app.post("/api/registro", requireAuth(["ADMIN", "POLIZIA_LOCALE", "CANILE_SANITARIO"]), async (req, res) => {
  const data = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
    const comune = activeRow[0]?.value_data || 'naro';
    
    const [result]: any = await mysqlPool.execute("INSERT INTO registro_anagrafica (microchip, comune_key, nome, specie, sesso, taglia, colore, condizioni_sanitarie, stato, foto_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [data.microchip, comune, data.nome, data.specie, data.sesso, data.taglia, data.colore, data.condizioniSanitarie, data.stato, data.fotoUrl]
    );
    res.json({ success: true, id: result.insertId || Date.now() });
  } catch (err: any) {
    console.error("Errore inserimento animale registro:", err.message);
    if (err.message.includes("Duplicate entry") || err.message.includes("UNIQUE") || err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Questo codice microchip risulta già registrato nel sistema." });
    }
    res.status(500).json({ error: "Errore durante l'inserimento nel registro dell'Anagrafe Canina." });
  }
});

app.put("/api/registro/:id", requireAuth(["ADMIN", "POLIZIA_LOCALE", "CANILE_SANITARIO"]), async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  await mysqlPool.execute("UPDATE registro_anagrafica SET nome=?, specie=?, sesso=?, taglia=?, colore=?, condizioni_sanitarie=?, stato=?, foto_url=? WHERE id=?",
    [data.nome, data.specie, data.sesso, data.taglia, data.colore, data.condizioniSanitarie, data.stato, data.fotoUrl, id]
  );
  res.json({ success: true });
});

// --- ECOSYSTEM ENDPOINTS FOR ADOPTIONS & FINANCES ---

// 1. ADOZIONI (Adoptions)
// Helper to write audit logs for adoptions
async function logAdozioneOperazione(comuneKey: string, adozioneId: number | null, operatore: string, operazione: string, dettagli: string) {
  if (!mysqlPool || !getIsMysqlHealthy()) return;
  try {
    await mysqlPool.execute(
      "INSERT INTO adozioni_operazioni_logs (comune_key, adozione_id, operatore, operazione, dettagli) VALUES (?, ?, ?, ?, ?)",
      [comuneKey, adozioneId, operatore, operazione, dettagli]
    );
  } catch (err) {
    console.error("Errore scrittura log adozioni:", err);
  }
}

app.get("/api/adozioni", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';
  
  const queryStr = `
    SELECT a.*, r.nome as animal_nome, r.specie as animal_specie, r.foto_url as animal_foto
    FROM adozioni a
    LEFT JOIN registro_anagrafica r ON a.registro_id = r.id
    WHERE a.comune_key = ?
    ORDER BY a.data_richiesta DESC
  `;
  const [rows] = await mysqlPool.execute(queryStr, [comune]);
  res.json(rows);
});

app.get("/api/adozioni/logs", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';

  try {
    const [rows] = await mysqlPool.execute(
      "SELECT * FROM adozioni_operazioni_logs WHERE comune_key = ? ORDER BY timestamp DESC LIMIT 200",
      [comune]
    );
    res.json(rows);
  } catch (err) {
    console.error("Errore recupero log adozioni:", err);
    res.status(500).json([]);
  }
});

app.post("/api/adozioni", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  const data = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';
  const user = (req as any).user.username;

  const [result]: any = await mysqlPool.execute(
    "INSERT INTO adozioni (registro_id, comune_key, adottante_nome, adottante_cf, adottante_tel, adottante_email, stato, note, creato_da) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [data.registro_id, comune, data.adottante_nome, data.adottante_cf, data.adottante_tel, data.adottante_email, data.stato || 'IN_VALUTAZIONE', data.note || '', user]
  );
  const newId = result.insertId;

  await logAdozioneOperazione(comune, newId, user, 'CREAZIONE', `Creata nuova richiesta di adozione. Adottante: ${data.adottante_nome}, CF: ${data.adottante_cf}`);

  res.json({ success: true, id: newId });
});

app.put("/api/adozioni/:id", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });

  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';
  const user = (req as any).user.username;

  const [orig]: any = await mysqlPool.execute("SELECT * FROM adozioni WHERE id = ?", [id]);
  if (!orig || orig.length === 0) {
    return res.status(404).json({ error: "Pratica adozione non trovata." });
  }

  await mysqlPool.execute(
    "UPDATE adozioni SET adottante_nome=?, adottante_cf=?, adottante_tel=?, adottante_email=?, stato=?, esito=?, note=?, modificato_da=? WHERE id=?",
    [
      data.adottante_nome !== undefined ? data.adottante_nome : orig[0].adottante_nome,
      data.adottante_cf !== undefined ? data.adottante_cf : orig[0].adottante_cf,
      data.adottante_tel !== undefined ? data.adottante_tel : orig[0].adottante_tel,
      data.adottante_email !== undefined ? data.adottante_email : orig[0].adottante_email,
      data.stato !== undefined ? data.stato : orig[0].stato,
      data.esito !== undefined ? data.esito : orig[0].esito,
      data.note !== undefined ? data.note : orig[0].note,
      user,
      id
    ]
  );

  const stato = data.stato || orig[0].stato;
  const esito = data.esito || orig[0].esito;
  if (stato === 'APPROVATA' || esito === 'APPROVATA') {
    const animalId = orig[0].registro_id;
    await mysqlPool.execute("UPDATE registro_anagrafica SET stato='ADOTTATO' WHERE id=?", [animalId]);
  }

  await logAdozioneOperazione(comune, Number(id), user, 'MODIFICA', `Modificata pratica adozione. Nuovo stato: ${stato}, esito: ${esito || 'N.D.'}`);

  res.json({ success: true });
});

app.put("/api/adozioni/:id/stato", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  const { id } = req.params;
  const { stato, esito, note } = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';
  const user = (req as any).user.username;

  await mysqlPool.execute(
    "UPDATE adozioni SET stato=?, esito=?, note=?, modificato_da=? WHERE id=?",
    [stato, esito || null, note || '', user, id]
  );

  if (stato === 'APPROVATA' || esito === 'APPROVATA') {
    const [adoptionRows]: any = await mysqlPool.execute("SELECT registro_id FROM adozioni WHERE id = ?", [id]);
    if (adoptionRows && adoptionRows[0]) {
      const animalId = adoptionRows[0].registro_id;
      await mysqlPool.execute("UPDATE registro_anagrafica SET stato='ADOTTATO' WHERE id=?", [animalId]);
    }
  }

  await logAdozioneOperazione(comune, Number(id), user, 'MODIFICA', `Modifica rapid_stato a: ${stato}, esito: ${esito || 'Nessuno'}`);

  res.json({ success: true });
});

app.delete("/api/adozioni/:id", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  const { id } = req.params;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });

  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';
  const user = (req as any).user.username;

  const [orig]: any = await mysqlPool.execute("SELECT * FROM adozioni WHERE id = ?", [id]);
  if (!orig || orig.length === 0) {
    return res.status(404).json({ error: "Pratica adozione non trovata." });
  }

  await mysqlPool.execute("DELETE FROM adozioni WHERE id = ?", [id]);

  await logAdozioneOperazione(comune, Number(id), user, 'ELIMINAZIONE', `Eliminata richiesta di adozione. Adottante rimosso: ${orig[0].adottante_nome}`);

  res.json({ success: true });
});

app.post("/api/adozioni/:id/clona", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  const { id } = req.params;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });

  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';
  const user = (req as any).user.username;

  const [orig]: any = await mysqlPool.execute("SELECT * FROM adozioni WHERE id = ?", [id]);
  if (!orig || orig.length === 0) {
    return res.status(404).json({ error: "Pratica da clonare non trovata." });
  }

  const item = orig[0];
  const [result]: any = await mysqlPool.execute(
    "INSERT INTO adozioni (registro_id, comune_key, adottante_nome, adottante_cf, adottante_tel, adottante_email, stato, note, creato_da) VALUES (?, ?, ?, ?, ?, ?, 'IN_VALUTAZIONE', ?, ?)",
    [item.registro_id, comune, item.adottante_nome + " (Clonata)", item.adottante_cf, item.adottante_tel, item.adottante_email, `Pratica clonata da ID ${id}. ` + (item.note || ''), user]
  );
  const clonedId = result.insertId;

  await logAdozioneOperazione(comune, clonedId, user, 'CLONAZIONE', `Clonata pratica dall'id d'origine: ${id}`);

  res.json({ success: true, id: clonedId });
});

// 2. STRUTTURE (Shelters / Clinics)
app.get("/api/strutture", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';

  const [rows] = await mysqlPool.execute("SELECT * FROM strutture WHERE comune_key = ?", [comune]);
  res.json(rows);
});

app.post("/api/strutture", async (req, res) => {
  const data = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';

  await mysqlPool.execute(
    "INSERT INTO strutture (comune_key, nome, tipo, indirizzo, telefono, capacita_max, postazioni_occupate) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [comune, data.nome, data.tipo, data.indirizzo, data.telefono || '', data.capacita_max || 100, data.postazioni_occupate || 0]
  );
  res.json({ success: true });
});

// 3. FATTURE & BILANCIO (Invoices & Finanze)
app.get("/api/fatture", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';

  const [rows] = await mysqlPool.execute("SELECT * FROM fatture WHERE comune_key = ? ORDER BY data_emissione DESC", [comune]);
  res.json(rows);
});

app.post("/api/fatture", async (req, res) => {
  const data = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';

  await mysqlPool.execute(
    "INSERT INTO fatture (comune_key, fornitore, numero_fattura, data_emissione, importo_totale, stato, documento_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [comune, data.fornitore, data.numero_fattura, data.data_emissione, data.importo_totale, data.stato || 'DA_PAGARE', data.documento_url || '']
  );
  res.json({ success: true });
});

// 4. CONVENZIONI (Municipal Covenants & Agreements)
app.get("/api/convenzioni", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';

  const queryStr = `
    SELECT c.*, s.nome as struttura_nome 
    FROM convenzioni c
    LEFT JOIN strutture s ON c.struttura_id = s.id
    WHERE c.comune_key = ?
    ORDER BY c.data_inizio DESC
  `;
  const [rows] = await mysqlPool.execute(queryStr, [comune]);
  res.json(rows);
});

app.post("/api/convenzioni", async (req, res) => {
  const data = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';

  await mysqlPool.execute(
    "INSERT INTO convenzioni (comune_key, struttura_id, tipo_servizio, data_inizio, data_fine, importo_annuo, stato, documento_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [comune, data.struttura_id, data.tipo_servizio, data.data_inizio, data.data_fine, data.importo_annuo, data.stato || 'ATTIVA', data.documento_url || '']
  );
  res.json({ success: true });
});

app.get("/api/debug/db", async (req, res) => {
  let userRows: any[] = [];
  let dbError: string | null = null;
  let activeBackend = "unknown";

  try {
    if (mysqlPool) {
      const [rows]: any = await mysqlPool.execute("SELECT id, username, role, email, comune_key FROM admin_users");
      userRows = rows || [];
      activeBackend = process.env.DB_HOST ? "MySQL (Aruba)" : "SQLite / Virtual DB Fallback";
    } else {
      activeBackend = "mysqlPool is undefined";
    }
  } catch (err: any) {
    dbError = err.message;
  }

  res.json({ 
    mysql: getIsMysqlHealthy() ? "Connected / Fallback Active" : "Disconnected/Error",
    firestore: admin.apps.length ? "Connected" : "Not Initialized",
    env: {
      has_db_host: !!process.env.DB_HOST,
      has_db_name: !!process.env.DB_NAME,
      has_db_user: !!process.env.DB_USER,
      is_vercel: process.env.VERCEL === "1",
    },
    activeBackend,
    usersCount: userRows.length,
    usersList: userRows.map(u => ({ username: u.username, role: u.role, email: u.email || null, comune_key: u.comune_key })),
    error: dbError
  });
});

app.post("/api/chat", async (req, res) => {
  const ai = getGenAI();
  if (!ai) {
    return res.status(500).json({ error: "Servizio di intelligenza artificiale non configurato sul server. Verifica GEMINI_API_KEY." });
  }

  try {
    const rawMessages = req.body.messages || [];
    
    // Map messages to Gemini contents structure
    const contents = rawMessages.map((m: any) => {
      // Map "assistant" role to "model" for Gemini API compatibility
      const role = m.role === "assistant" ? "model" : "user";
      return {
        role: role,
        parts: [{ text: m.content }]
      };
    });

    if (contents.length === 0 && req.body.message) {
      contents.push({
        role: "user",
        parts: [{ text: req.body.message }]
      });
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: "Nessun messaggio fornito nella richiesta." });
    }

    // Prepare system instruction training and context
    const docsSerialized = REGOLAMENTI_CONTESTO.map(doc => `
Documento Categoria/Titolo: ${doc.titolo}
Identificatore Atto: ${doc.identificativo}
Aggiornamento / Data Svolta: ${doc.dataSorgente}
Sommario Punti Chiave:
${doc.puntiChiave.map(p => ` - ${p}`).join("\n")}

Testo Legale Integrale:
${doc.testoIntegrale}
`).join("\n\n---------------------------------------------\n\n");

    const systemInstructionText = `
Sei "Ugo", l'Assistente virtuale della Guida Comunale Intelligente del Comune di Naro (Agrigento). Sei un'intelligenza artificiale addestrata e programmata per supportare i cittadini, i volontari e gli operatori comunali in merito al welfare animale, alla prevenzione del randagismo e ai regolamenti d'ufficio della P.A.

FONDAMENTALE: Rispondi basandoti in modo fedele e accurato sulle seguenti normative, regolamenti comunali e documenti ufficiali caricati dal Comune di Naro. Quando possibile, cita gli articoli specifici di riferimento per avallare le tue risposte (es. "Art. 5 del Regolamento Comunale di Naro" o "Art. 2 della L.R. Siciliana 15/2000").

=== REGOLAMENTI E DOCUMENTI UFFICIALI DI ANAGRAFE E RANDAGISMO ===
${docsSerialized}

=== DIRETTIVE DI COMPORTAMENTO ===
1. Parla sempre in italiano letterario, con un tono educato, cordiale, accogliente e informato (adatto alla PA e comprensibile dal comune cittadino).
2. Sii sintetico ma esaustivo. Quando elenchi adempimenti o passaggi organizzali con elenchi puntati chiari.
3. Se l'utente fa domande del tutto estranee agli animali, al randagismo, ai canili rionali, alle colonie feline, alle sanzioni o ai moduli A/B/C del Comune di Naro, rispondi educatamente che sei l'Assistente virtuale specializzato sulla fauna e il randagismo del portale AnimalHub di Naro, invitando ad attenersi a questi argomenti.
4. Evidenzia l'importanza del Codice Opzione Famiglia (COF) e del fantastico incentivo dell'esenzione sui rifiuti territoriali (TARI) per 3 anni concessa a chi adotta.
`;

    // Invoke Gemini 2.5 Flash as standard for Q&A tasks
    const response = await ai.models.generateContent({
      model: "gemini-2.1-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstructionText,
        temperature: 0.3,
      }
    });

    const replyText = response.text || "Spiacente, non sono riuscito a elaborare una risposta soddisfacente.";
    res.json({ reply: replyText });
  } catch (err: any) {
    console.error("Errore chiamata Gemini:", err.message);
    res.status(500).json({ error: "Errore durante l'elaborazione della risposta con l'Intelligenza Artificiale.", details: err.message });
  }
});

async function seedAdminUsers() {
  if (!mysqlPool || !getIsMysqlHealthy()) return;
  try {
    // Sincronizzazione / Aggiornamento degli account esistenti per allineare l'email
    console.log("Sincronizzazione contatti e-mail amministratori e operatori nel DB...");
    const updates = [
      { username: "admin", email: "franco.tese@gmail.com" },
      { username: "polizia", email: "polizia@animalhubpa.it" },
      { username: "canile", email: "canile@animalhubpa.it" },
      { username: "volontario", email: "volontari@animalhubpa.it" }
    ];

    for (const item of updates) {
      try {
        await mysqlPool.execute("UPDATE admin_users SET email = ? WHERE username = ?", [item.email, item.username]);
      } catch (err: any) {
        console.warn(`Avviso: impossibile aggiornare email per ${item.username}:`, err.message);
      }
    }

    const [rows]: any = await mysqlPool.execute("SELECT COUNT(*) as count FROM admin_users");
    const count = rows[0]?.count || 0;
    if (count === 0) {
      console.log("Seeding default administrative operators...");
      const adminHash = await bcrypt.hash("admin2026", 10);
      const poliziaHash = await bcrypt.hash("polizia2026", 10);
      const canileHash = await bcrypt.hash("canile2026", 10);
      const volontarioHash = await bcrypt.hash("volontario2026", 10);

      const allModules = JSON.stringify(['statistiche', 'modulo-b', 'modulo-c', 'modulo-adozioni']);
      const policeModules = JSON.stringify(['modulo-b', 'modulo-c']);
      const kennelModules = JSON.stringify(['modulo-b', 'modulo-c', 'modulo-adozioni']);
      const volunteerModules = JSON.stringify(['modulo-b']);

      const tryInsert = async (username: string, hash: string, role: string, modules: string, email: string) => {
        try {
          // Try with email and visible_modules
          await mysqlPool!.execute(
            "INSERT INTO admin_users (username, password_hash, role, comune_key, visible_modules, email) VALUES (?, ?, ?, ?, ?, ?)",
            [username, hash, role, "naro", modules, email]
          );
        } catch (e: any) {
          // Fallback if schema isn't fully migrated
          if (e.message.includes("Unknown column")) {
            await mysqlPool!.execute(
              "INSERT INTO admin_users (username, password_hash, role, comune_key) VALUES (?, ?, ?, ?)",
              [username, hash, role, "naro"]
            );
          }
        }
      };

      await tryInsert("admin", adminHash, "ADMIN", allModules, "franco.tese@gmail.com");
      await tryInsert("polizia", poliziaHash, "POLIZIA_LOCALE", policeModules, "polizia@animalhubpa.it");
      await tryInsert("canile", canileHash, "CANILE_SANITARIO", kennelModules, "canile@animalhubpa.it");
      await tryInsert("volontario", volontarioHash, "VOLONTARIO", volunteerModules, "volontari@animalhubpa.it");
      console.log("Succesfully seeded 4 default admin operator accounts.");
    }
  } catch (err) {
    console.error("Error seeding or syncing default admin users:", err);
  }
}

async function bootServer() {
  await getDbInitPromise();
  
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite non disponibile. Ignoro setup development.", e);
    }
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      if (req.url.startsWith("/api/")) {
         return res.status(404).json({ error: "API Route Not Found on Vercel: " + req.url });
      }
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }
  
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

bootServer();

export default app;
