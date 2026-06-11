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
import mysqlPool, { getIsMysqlHealthy, setMysqlHealthy } from "./src/lib/mysql";
import segnalazioniRouter from "./src/pages/api/segnalazioni";
import otpRouter from "./src/pages/api/otp";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { createMySQLTables, addMySQLColumns } from "./src/lib/mysql_init";

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
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.headers['user-agent'] || '';

    if (user && await bcrypt.compare(password, user.password_hash)) {
      if (user.email) {
        // Generate and store OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await mysqlPool.execute(
          "INSERT INTO user_otps (email, otp_code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp_code = ?, expires_at = ?",
          [user.email, otp, expiresAt, otp, expiresAt]
        );
        console.log(`[OTP ADMIN] Email: ${user.email} - Codice: ${otp} (Simulato)`);

        // Log access request
        await mysqlPool.execute(
          "INSERT INTO admin_access_logs (username, comune_key, ip_address, user_agent, accesso_riuscito, note) VALUES (?, ?, ?, ?, ?, ?)",
          [username, user.comune_key || "naro", ip, userAgent, 1, "Password valida - Richiesto OTP"]
        );

        res.json({ success: true, requireOtp: true, email: user.email });
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

app.post("/api/admin/login/verify-otp", async (req, res) => {
  const { username, otp } = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const [userRows]: any = await mysqlPool.execute("SELECT * FROM admin_users WHERE username = ?", [username]);
    const user = userRows[0];
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.headers['user-agent'] || '';

    if (!user || !user.email) {
      return res.status(401).json({ error: "Utente non trovato o email mancante" });
    }

    const [otpRows]: any = await mysqlPool.execute(
      "SELECT * FROM user_otps WHERE email = ? AND otp_code = ? AND expires_at > NOW()",
      [user.email, otp]
    );

    if (otpRows.length > 0) {
      await mysqlPool.execute("DELETE FROM user_otps WHERE email = ?", [user.email]);
      const token = jwt.sign({ username: user.username, role: user.role, comune_key: user.comune_key }, "animal-hub-secret");
      res.cookie("admin_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });

      // Log successful OTP verify
      await mysqlPool.execute(
        "INSERT INTO admin_access_logs (username, comune_key, ip_address, user_agent, accesso_riuscito, note) VALUES (?, ?, ?, ?, ?, ?)",
        [username, user.comune_key || "naro", ip, userAgent, 1, "OTP verificato con successo"]
      );

      res.json({ success: true, token });
    } else {
      // Log failed OTP verify
      await mysqlPool.execute(
        "INSERT INTO admin_access_logs (username, comune_key, ip_address, user_agent, accesso_riuscito, note) VALUES (?, ?, ?, ?, ?, ?)",
        [username, user.comune_key || "naro", ip, userAgent, 0, "Codice OTP non valido o scaduto"]
      );

      res.status(401).json({ error: "Codice OTP non valido o scaduto" });
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
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.headers['user-agent'] || '';
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
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.headers['user-agent'] || '';
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

app.get("/api/registro", requireAuth(["ADMIN", "POLIZIA_LOCALE", "CANILE_SANITARIO", "VOLONTARIO"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  const [rows] = await mysqlPool.execute("SELECT * FROM registro_anagrafica");
  res.json(rows);
});

app.post("/api/registro", requireAuth(["ADMIN", "POLIZIA_LOCALE", "CANILE_SANITARIO"]), async (req, res) => {
  const data = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';
  
  await mysqlPool.execute("INSERT INTO registro_anagrafica (microchip, comune_key, nome, specie, sesso, taglia, colore, condizioni_sanitarie, stato, foto_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [data.microchip, comune, data.nome, data.specie, data.sesso, data.taglia, data.colore, data.condizioniSanitarie, data.stato, data.fotoUrl]
  );
  res.json({ success: true });
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

app.post("/api/adozioni", async (req, res) => {
  const data = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';

  await mysqlPool.execute(
    "INSERT INTO adozioni (registro_id, comune_key, adottante_nome, adottante_cf, adottante_tel, adottante_email, stato, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [data.registro_id, comune, data.adottante_nome, data.adottante_cf, data.adottante_tel, data.adottante_email, data.stato || 'IN_VALUTAZIONE', data.note || '']
  );
  res.json({ success: true });
});

app.put("/api/adozioni/:id/stato", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  const { id } = req.params;
  const { stato, esito, note } = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  
  await mysqlPool.execute(
    "UPDATE adozioni SET stato=?, esito=?, note=? WHERE id=?",
    [stato, esito || null, note || '', id]
  );

  if (stato === 'APPROVATA' || esito === 'APPROVATA') {
    const [adoptionRows]: any = await mysqlPool.execute("SELECT registro_id FROM adozioni WHERE id = ?", [id]);
    if (adoptionRows && adoptionRows[0]) {
      const animalId = adoptionRows[0].registro_id;
      await mysqlPool.execute("UPDATE registro_anagrafica SET stato='ADOTTATO' WHERE id=?", [animalId]);
    }
  }
  res.json({ success: true });
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
  res.json({ 
    mysql: getIsMysqlHealthy() ? "Connected" : "Disconnected/Error",
    firestore: admin.apps.length ? "Connected" : "Not Initialized"
  });
});

app.post("/api/chat", async (req, res) => {
  res.json({ message: "Chat AI is temporarily under maintenance while SQLite dependencies are strictly removed." });
});

async function seedAdminUsers() {
  if (!mysqlPool || !getIsMysqlHealthy()) return;
  try {
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

      await tryInsert("admin", adminHash, "ADMIN", allModules, "admin@animalhubpa.it");
      await tryInsert("polizia", poliziaHash, "POLIZIA_LOCALE", policeModules, "polizia@animalhubpa.it");
      await tryInsert("canile", canileHash, "CANILE_SANITARIO", kennelModules, "canile@animalhubpa.it");
      await tryInsert("volontario", volontarioHash, "VOLONTARIO", volunteerModules, "volontari@animalhubpa.it");
      console.log("Succesfully seeded 4 default admin operator accounts.");
    }
  } catch (err) {
    console.error("Error seeding default admin users:", err);
  }
}

async function bootServer() {
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
    // Solo verifica DB base su Vercel per evitare saturazione connessioni Aruba
    console.log("[VERCEL] Skipping auto-migrations on cold start.");
  }
  
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
    app.get("*", (_, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));
  }
  
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

bootServer();

export default app;
