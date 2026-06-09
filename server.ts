import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const decoded = jwt.verify(token, "animal-hub-secret");
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: "Token non valido" });
  }
});

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  const [rows]: any = await mysqlPool.execute("SELECT * FROM admin_users WHERE username = ?", [username]);
  const user = rows[0];
  if (user && await bcrypt.compare(password, user.password_hash)) {
    const token = jwt.sign({ username: user.username, role: user.role, comune_key: user.comune_key }, "animal-hub-secret");
    res.cookie("admin_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: "Credenziali non valide" });
  }
});

app.post("/api/admin/logout", (req, res) => {
  res.clearCookie("admin_token");
  res.json({ success: true });
});

app.get("/api/admin/config", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json({});
  const [rows]: any = await mysqlPool.execute("SELECT * FROM admin_config");
  const config = rows.reduce((acc: any, row: any) => ({ ...acc, [row.key_name]: row.value_data }), {});
  res.json(config);
});

app.post("/api/admin/config", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  for (const [key, value] of Object.entries(req.body)) {
    await mysqlPool.execute("INSERT INTO admin_config (key_name, value_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_data = ?", [key, String(value), String(value)]);
  }
  res.json({ success: true });
});

app.post("/api/admin/demo-switch", async (req, res) => {
  const { key } = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  await mysqlPool.execute("UPDATE admin_config SET value_data = ? WHERE key_name = 'activeComune'", [key]);
  res.json({ success: true });
});

app.get("/api/comuni", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  const [rows] = await mysqlPool.execute("SELECT * FROM comuni");
  res.json(rows);
});

app.get("/api/interventi_logs", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  
  const [rows] = await mysqlPool.execute("SELECT * FROM interventi_logs WHERE comune_key = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?", [comune, limit, offset]);
  res.json({ data: rows, nextOffset: offset + limit });
});

app.get("/api/registro", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  const [rows] = await mysqlPool.execute("SELECT * FROM registro_anagrafica");
  res.json(rows);
});

app.post("/api/registro", async (req, res) => {
  const data = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
  const comune = activeRow[0]?.value_data || 'naro';
  
  await mysqlPool.execute("INSERT INTO registro_anagrafica (microchip, comune_key, nome, specie, sesso, taglia, colore, condizioni_sanitarie, stato, foto_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [data.microchip, comune, data.nome, data.specie, data.sesso, data.taglia, data.colore, data.condizioniSanitarie, data.stato, data.fotoUrl]
  );
  res.json({ success: true });
});

app.put("/api/registro/:id", async (req, res) => {
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

app.put("/api/adozioni/:id/stato", async (req, res) => {
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

async function bootServer() {
  await createMySQLTables();
  await addMySQLColumns();
  
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (_, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));
  }
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootServer();
