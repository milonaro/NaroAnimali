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
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import mysqlPool, { getIsMysqlHealthy, setMysqlHealthy, getPool } from "./src/lib/mysql";
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

// Leggiamo la configurazione client per estrarre la corretta istanza del database Firestore
let firestoreDatabaseId: string | undefined = undefined;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    firestoreDatabaseId = config.firestoreDatabaseId;
  }
} catch (e) {
  console.error("Error reading firebase-applet-config.json in server.ts:", e);
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

const db = admin.apps.length ? (firestoreDatabaseId ? getFirestoreAdmin(admin.app(), firestoreDatabaseId) : admin.firestore()) : null;

async function startServer() {
  let sqliteDb: any = null;

  // Always initialize SQLite database first as a secure local backup.
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
      role TEXT DEFAULT 'OPERATORE',
      comune_key TEXT DEFAULT 'naro'
    );
    CREATE TABLE IF NOT EXISTS registro_anagrafica (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      microchip TEXT UNIQUE,
      comune_key TEXT NOT NULL DEFAULT 'naro',
      nome TEXT,
      specie TEXT,
      sesso TEXT,
      taglia TEXT,
      colore TEXT,
      condizioni_sanitarie TEXT,
      stato TEXT,
      foto_url TEXT,
      data_registrazione DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS interventi_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comune_key TEXT NOT NULL DEFAULT 'naro',
      segnalazione_codice TEXT,
      operatore TEXT,
      azione TEXT,
      note TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS segnalazioni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comune_key TEXT NOT NULL DEFAULT 'naro',
      codice_tracking TEXT UNIQUE,
      specie TEXT,
      condizioni TEXT,
      descrizione TEXT,
      foto_url TEXT,
      latitudine REAL,
      longitudine REAL,
      indirizzo TEXT,
      stato TEXT DEFAULT 'CREATA',
      urgenza TEXT DEFAULT 'NORMALE',
      email_segnalante TEXT,
      nome_segnalante TEXT,
      consenso_privacy INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS comuni (
      key_name TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      radius_km REAL NOT NULL,
      lat_min REAL NOT NULL,
      lat_max REAL NOT NULL,
      lng_min REAL NOT NULL,
      lng_max REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ruoli_operatore (
      ruolo_key TEXT PRIMARY KEY,
      descrizione TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tipologie_animali (
      specie_key TEXT PRIMARY KEY,
      descrizione TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS strutture (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comune_key TEXT NOT NULL DEFAULT 'naro',
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL,
      indirizzo TEXT NOT NULL,
      telefono TEXT,
      capacita_max INTEGER,
      postazioni_occupate INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  if (mysqlPool) {
    try {
      console.log("Verifica connessione MySQL (Aruba) in corso con timeout...");
      
      // Probe active connection with a short timeout
      await Promise.race([
        mysqlPool.execute("SELECT 1"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout connessione database MySQL")), 3000))
      ]);

      console.log("Connessione MySQL riuscita! Configuro le tabelle sul database remoto...");

      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS admin_config (
          key_name VARCHAR(100) PRIMARY KEY,
          value_data TEXT
        )
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'OPERATORE',
          comune_key VARCHAR(50) DEFAULT 'naro'
        )
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS registro_anagrafica (
          id INT AUTO_INCREMENT PRIMARY KEY,
          microchip VARCHAR(50) UNIQUE NOT NULL,
          comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
          nome VARCHAR(100),
          specie VARCHAR(50),
          sesso VARCHAR(10),
          taglia VARCHAR(50),
          colore VARCHAR(100),
          condizioni_sanitarie TEXT,
          stato VARCHAR(50),
          foto_url TEXT,
          data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS interventi_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
          segnalazione_codice VARCHAR(100),
          operatore VARCHAR(100),
          azione TEXT,
          note TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS segnalazioni (
          id INT AUTO_INCREMENT PRIMARY KEY,
          comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
          codice_tracking VARCHAR(100) UNIQUE,
          specie VARCHAR(50),
          condizioni VARCHAR(255),
          descrizione TEXT,
          foto_url TEXT,
          latitudine DECIMAL(10, 8),
          longitudine DECIMAL(11, 8),
          indirizzo VARCHAR(255),
          stato VARCHAR(50) DEFAULT 'CREATA',
          urgenza VARCHAR(50) DEFAULT 'NORMALE',
          email_segnalante VARCHAR(150),
          nome_segnalante VARCHAR(100),
          consenso_privacy TINYINT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS comuni (
          key_name VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          lat DECIMAL(10, 8) NOT NULL,
          lng DECIMAL(11, 8) NOT NULL,
          radius_km DECIMAL(5, 2) NOT NULL,
          lat_min DECIMAL(10, 8) NOT NULL,
          lat_max DECIMAL(10, 8) NOT NULL,
          lng_min DECIMAL(11, 8) NOT NULL,
          lng_max DECIMAL(11, 8) NOT NULL
        )
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS ruoli_operatore (
          ruolo_key VARCHAR(50) PRIMARY KEY,
          descrizione VARCHAR(150) NOT NULL
        )
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS tipologie_animali (
          specie_key VARCHAR(50) PRIMARY KEY,
          descrizione VARCHAR(150) NOT NULL
        )
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS strutture (
          id INT AUTO_INCREMENT PRIMARY KEY,
          comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
          nome VARCHAR(150) NOT NULL,
          tipo VARCHAR(50) NOT NULL,
          indirizzo VARCHAR(255) NOT NULL,
          telefono VARCHAR(20),
          capacita_max INT,
          postazioni_occupate INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      setMysqlHealthy(true);
    } catch (e) {
      console.error("Errore o timeout connessione a MySQL, failover attivato:", e);
      setMysqlHealthy(false);
    }
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Helper centralizzato per estrarre il comune attivo
  async function getActiveComuneKeyServer(dbSq: any): Promise<string> {
    let key = "naro";
    try {
      if (getIsMysqlHealthy() && mysqlPool) {
        const [rows]: any = await mysqlPool.query("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
        if (rows && rows[0]) {
          key = rows[0].value_data;
        }
      } else {
        const row = await dbSq.get("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
        if (row) {
          key = row.value_data;
        }
      }
    } catch (err) {
      console.error("Errore lettura activeComune:", err);
    }
    return key;
  }

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
  
  if (getIsMysqlHealthy() && mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.execute('SELECT count(*) as c FROM admin_users');
      if (rows[0].c < 8) {
        for (const usr of defaultUsers) {
          await mysqlPool.execute('INSERT IGNORE INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)', [usr.u, defaultPass, usr.r]);
        }
      }
    } catch(e) {}
  }
  
  if (sqliteDb) {
    try {
      const row = await sqliteDb.get('SELECT count(*) as c FROM admin_users');
      if (row.c < 8) {
        for (const usr of defaultUsers) {
          await sqliteDb.run('INSERT OR IGNORE INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)', [usr.u, defaultPass, usr.r]);
        }
      }
    } catch(e) {}
  }

  // Seeding function for all reference lists & demo datasets
  async function seedDatabaseReferenceAndPresets() {
    console.log("Inizializzazione dati di riferimento e preset commerciali...");
    
    const listComuni = [
      { key: 'naro', name: 'Naro', lat: 37.2957, lng: 13.7936, radius_km: 8.0, lat_min: 37.25, lat_max: 37.35, lng_min: 13.74, lng_max: 13.85 },
      { key: 'agrigento', name: 'Agrigento', lat: 37.3111, lng: 13.5765, radius_km: 12.0, lat_min: 37.20, lat_max: 37.40, lng_min: 13.45, lng_max: 13.70 },
      { key: 'canicatti', name: 'Canicattì', lat: 37.3591, lng: 13.8496, radius_km: 10.0, lat_min: 37.30, lat_max: 37.42, lng_min: 13.75, lng_max: 13.95 },
      { key: 'favara', name: 'Favara', lat: 37.3151, lng: 13.6628, radius_km: 9.0, lat_min: 37.26, lat_max: 37.37, lng_min: 13.60, lng_max: 13.72 },
      { key: 'palermo', name: 'Palermo', lat: 38.1157, lng: 13.3614, radius_km: 15.0, lat_min: 38.00, lat_max: 38.25, lng_min: 13.20, lng_max: 13.50 },
    ];

    const listRuoli = [
      { key: 'ADMIN', desc: 'Amministratore di Sistema / Gestore del Portale' },
      { key: 'POLIZIA_LOCALE', desc: 'Operatore Polizia Municipale Ente Locale' },
      { key: 'CANILE_SANITARIO', desc: 'Veterinario e Operatore Canile Convenzionato' },
      { key: 'VOLONTARIO', desc: 'Volontario Associazione Protezione Animali Autorizzata' }
    ];

    const listTipologie = [
      { key: 'CANE', desc: 'Cane / Canide domestico' },
      { key: 'GATTO', desc: 'Gatto / Felide domestico' },
      { key: 'ALTRO', desc: 'Specie diversa (es. Volatile, Equino, Ovino)' }
    ];

    const listSegnalazioniDemo = [
      { id: 1, comune_key: 'naro', codice_tracking: 'TRK-2026-N1', specie: 'CANE', condizioni: 'Randagio disorientato in piazza', descrizione: 'Meticcio docile di taglia media, pelo castano focato. Sembra spaesato, cerca acqua vicino alla fontana civica.', foto_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600', latitudine: 37.2942, longitudine: 13.7928, indirizzo: 'Piazza Garibaldi, Naro (AG)', stato: 'CREATA', urgenza: 'NORMALE' },
      { id: 2, comune_key: 'naro', codice_tracking: 'TRK-2026-N2', specie: 'GATTO', condizioni: 'Ferito alla zampa posteriore', descrizione: 'Gattino europeo grigio pezzato bianco, zoppica visibilmente nel cortile interno del Castello di Naro.', foto_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600', latitudine: 37.2915, longitudine: 13.7915, indirizzo: 'Via Castello, Naro (AG)', stato: 'IN_CARICO', urgenza: 'ALTA' },
      { id: 3, comune_key: 'agrigento', codice_tracking: 'TRK-2026-A1', specie: 'CANE', condizioni: 'Pastore tedesco anziano disidratato', descrizione: 'Pastore tedesco anziano e molto affaticato che staziona all\'ombra di un gazebo sulla spiaggia di San Leone.', foto_url: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=600', latitudine: 37.2662, longitudine: 13.5898, indirizzo: 'Viale delle Dune, Agrigento (AG)', stato: 'CREATA', urgenza: 'ALTA' },
      { id: 4, comune_key: 'agrigento', codice_tracking: 'TRK-2026-A2', specie: 'GATTO', condizioni: 'Gattini con forte raffreddore', descrizione: 'Tre gattini piccoli di circa 2 mesi con vistoso scolo oculare e nasale nei pressi dell\'ingresso posteriore del teatro.', foto_url: 'https://images.unsplash.com/photo-1574158622643-69d34d72650a?auto=format&fit=crop&q=80&w=600', latitudine: 37.3115, longitudine: 13.5758, indirizzo: 'Via Atenea, Agrigento (AG)', stato: 'IN_CARICO', urgenza: 'NORMALE' },
      { id: 5, comune_key: 'canicatti', codice_tracking: 'TRK-2026-C1', specie: 'CANE', condizioni: 'Meticcio nero terrorizzato sui binari', descrizione: 'Meticcio taglia media nero con petto bianco. Si aggira terrorizzato sulle banchine della stazione ferroviaria.', foto_url: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&q=80&w=600', latitudine: 37.3578, longitudine: 13.8485, indirizzo: 'Piazza Stazione, Canicattì (AG)', stato: 'CREATA', urgenza: 'ALTA' },
      { id: 6, comune_key: 'canicatti', codice_tracking: 'TRK-2026-C2', specie: 'GATTO', condizioni: 'Gattino salvato, pronto al riscatto', descrizione: 'Gattino bianco e grigio trovato sano in un contenitore, accudito in degenza temporanea.', foto_url: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?auto=format&fit=crop&q=80&w=600', latitudine: 37.3605, longitudine: 13.8512, indirizzo: 'Viale della Vittoria, Canicattì (AG)', stato: 'RISOLTA', urgenza: 'ALTA' },
      { id: 7, comune_key: 'favara', codice_tracking: 'TRK-2026-F1', specie: 'CANE', condizioni: 'Cane investito ferito alla zampa', descrizione: 'Cane meticcio marrone chiaro disteso sul marciapiede, guaisce per forte dolore.', foto_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=600', latitudine: 37.3135, longitudine: 13.6642, indirizzo: 'Viale Aldo Moro, Favara (AG)', stato: 'CREATA', urgenza: 'CRITICA' },
      { id: 8, comune_key: 'favara', codice_tracking: 'TRK-2026-F2', specie: 'GATTO', condizioni: 'Gatto bloccato su alto cornicione', descrizione: 'Bellissimo gattino nero bloccato sopra il cornicione del secondo piano in piazza, immobile da stamattina.', foto_url: 'https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?auto=format&fit=crop&q=80&w=600', latitudine: 37.3168, longitudine: 13.6611, indirizzo: 'Piazza Cavour, Favara (AG)', stato: 'IN_CARICO', urgenza: 'ALTA' },
      { id: 9, comune_key: 'palermo', codice_tracking: 'TRK-2026-P1', specie: 'CANE', condizioni: 'Cani vaganti ma amichevoli', descrizione: 'Gruppo di 3 cani di grossa taglia stazionano mansueti nella zona verde, molto pacifici ma randagi.', foto_url: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=600', latitudine: 38.1568, longitudine: 13.3489, indirizzo: 'Parco della Favorita, Palermo (PA)', stato: 'CREATA', urgenza: 'NORMALE' },
      { id: 10, comune_key: 'palermo', codice_tracking: 'TRK-2026-P2', specie: 'GATTO', condizioni: 'Mamma gatta con 4 cuccioli', descrizione: 'Mamma gatta randagia molto smagrita ha partorito 4 cuccioli in un sottoscala, necessita di stallo sanitario sicuro.', foto_url: 'https://images.unsplash.com/photo-1614035030394-b6e5b01e0737?auto=format&fit=crop&q=80&w=600', latitudine: 38.1145, longitudine: 13.3622, indirizzo: 'Via Roma, Palermo (PA)', stato: 'IN_CARICO', urgenza: 'ALTA' }
    ];

    const listRegistroDemo = [
      { microchip: "380261000100001", comune_key: 'naro', nome: "Stella", specie: "CANE", sesso: "F", taglia: "MEDIA", colore: "Nero e focato", condizioni_sanitarie: "Sana, vaccinata antirabbica e sterilizzata.", stato: "ADOTTABILE", foto_url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600" },
      { microchip: "380261000100002", comune_key: 'naro', nome: "Fufi", specie: "GATTO", sesso: "M", taglia: "PICCOLA", colore: "Soriano grigio", condizioni_sanitarie: "Trattato per acari delle orecchie, molto coccolone.", stato: "OSPITE", foto_url: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=600" },
      { microchip: "380261000200001", comune_key: 'agrigento', nome: "Argo", specie: "CANE", sesso: "M", taglia: "GRANDE", colore: "Miele fulvo", condizioni_sanitarie: "In splendida salute, allegro e reattivo.", stato: "ADOTTABILE", foto_url: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600" },
      { microchip: "380261000200002", comune_key: 'agrigento', nome: "Micia", specie: "GATTO", sesso: "F", taglia: "PICCOLA", colore: "Tricolore calico", condizioni_sanitarie: "Sana, sterilizzata, adatta a bambini.", stato: "OSPITE", foto_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600" },
      { microchip: "380261000300001", comune_key: 'canicatti', nome: "Grimm", specie: "CANE", sesso: "M", taglia: "GRANDE", colore: "Fulvo scuro", condizioni_sanitarie: "Ex-randagio, sano e molto disciplinato.", stato: "ADOTTABILE", foto_url: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&q=80&w=600" },
      { microchip: "380261000300002", comune_key: 'canicatti', nome: "Nebbia", specie: "GATTO", sesso: "F", taglia: "MEDIA", colore: "Bianco candido", condizioni_sanitarie: "Niente parassiti, sterilizzata ed estremamente quieta.", stato: "ADOTTATO", foto_url: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&q=80&w=600" },
      { microchip: "380261000400001", comune_key: 'favara', nome: "Max", specie: "CANE", sesso: "M", taglia: "MEDIA", colore: "Bianco e nero", condizioni_sanitarie: "Sottoposto a sverminazione, molto socievole.", stato: "ADOTTABILE", foto_url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600" },
      { microchip: "380261000400002", comune_key: 'favara', nome: "Zelda", specie: "GATTO", sesso: "F", taglia: "PICCOLA", colore: "Nero pece", condizioni_sanitarie: "Ottima forma fisica, giocherellona.", stato: "ADOTTABILE", foto_url: "https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?auto=format&fit=crop&q=80&w=600" },
      { microchip: "380261000500001", comune_key: 'palermo', nome: "Dante", specie: "CANE", sesso: "M", taglia: "GRANDE", colore: "Bianco maremmano", condizioni_sanitarie: "Controllato dal veterinario ASP, idoneo all'adozione.", stato: "OSPITE", foto_url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600" },
      { microchip: "380261000500002", comune_key: 'palermo', nome: "Romeo", specie: "GATTO", sesso: "M", taglia: "MEDIA", colore: "Rosso tigrato", condizioni_sanitarie: "Trattato con antiparassitari, vacinato.", stato: "ADOTTABILE", foto_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600" }
    ];

    const listLogsDemo = [
      { comune_key: 'naro', report_id: "TRK-2026-N2", operatore: "veterinario", descrizione: "Sopralluogo ed esame clinico iniziale", note: "Presa in consegna e avviato protocollo antidolorifico per trauma zampa." },
      { comune_key: 'agrigento', report_id: "TRK-2026-A2", operatore: "polizia", descrizione: "Attivata l'ASP veterinaria di Agrigento", note: "Fornito supporto logistico in loco per la salvaguardia dei gattini feriti." },
      { comune_key: 'canicatti', report_id: "TRK-2026-C2", operatore: "canile", descrizione: "Tris di vaccinazioni e registrazione anagrafe", note: "Gattino trattato con successo e successivamente adottato." },
      { comune_key: 'favara', report_id: "TRK-2026-F2", operatore: "polizia", descrizione: "Invio squadra di soccorso", note: "Gli operatori stanno posizionando le scale idonee per l'animale bloccato." },
      { comune_key: 'palermo', report_id: "TRK-2026-P2", operatore: "veterinario", descrizione: "Ricovero neonatale ed esame ecografico", note: "Madre e cuccioli trasferiti in stallo sanitario idoneo." }
    ];

    const listStruttureDemo = [
      { comune_key: 'naro', nome: 'Canile Comprensoriale Dogland', tipo: 'CANILE', indirizzo: 'Contrada Zaffuti, Naro (AG)', telefono: '0922 123456', capacita_max: 150, postazioni_occupate: 120 },
      { comune_key: 'naro', nome: 'Oasi Felina La Coda', tipo: 'GATTILE', indirizzo: 'Via Agrigento, Naro (AG)', telefono: '0922 654321', capacita_max: 50, postazioni_occupate: 30 },
      { comune_key: 'agrigento', nome: 'Rifugio San Leone', tipo: 'RIFUGIO', indirizzo: 'Viale dei Pini, Agrigento (AG)', telefono: '0922 991122', capacita_max: 100, postazioni_occupate: 85 },
      { comune_key: 'canicatti', nome: 'Oasi Felina Canicattì', tipo: 'GATTILE', indirizzo: 'Via Vittorio Veneto, Canicattì (AG)', telefono: '0922 774411', capacita_max: 80, postazioni_occupate: 45 },
      { comune_key: 'favara', nome: 'Clinica Veterinaria Favara Vet', tipo: 'CLINICA_VET', indirizzo: 'Viale S. Angelo, Favara (AG)', telefono: '0922 885522', capacita_max: 20, postazioni_occupate: 12 },
      { comune_key: 'palermo', nome: 'Rifugio Municipale Palermo', tipo: 'CANILE', indirizzo: 'Parco della Favorita, Palermo (PA)', telefono: '091 668822', capacita_max: 300, postazioni_occupate: 245 }
    ];

    // Seeding SQLite Reference Values
    if (sqliteDb) {
      try {
        const countC = await sqliteDb.get('SELECT count(*) as c FROM comuni');
        if (countC.c === 0) {
          for (const item of listComuni) {
            await sqliteDb.run('INSERT INTO comuni (key_name, name, lat, lng, radius_km, lat_min, lat_max, lng_min, lng_max) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
              item.key, item.name, item.lat, item.lng, item.radius_km, item.lat_min, item.lat_max, item.lng_min, item.lng_max
            ]);
          }
          console.log("SQLite: inseriti comuni con successo!");
        }

        const countRuoli = await sqliteDb.get('SELECT count(*) as c FROM ruoli_operatore');
        if (countRuoli.c === 0) {
          for (const item of listRuoli) {
            await sqliteDb.run('INSERT INTO ruoli_operatore (ruolo_key, descrizione) VALUES (?, ?)', [item.key, item.desc]);
          }
        }

        const countTipologie = await sqliteDb.get('SELECT count(*) as c FROM tipologie_animali');
        if (countTipologie.c === 0) {
          for (const item of listTipologie) {
            await sqliteDb.run('INSERT INTO tipologie_animali (specie_key, descrizione) VALUES (?, ?)', [item.key, item.desc]);
          }
        }

        // Carica activeComune, siteName, siteLogo se mancanti
        const activeComuneRow = await sqliteDb.get("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
        if (!activeComuneRow) {
          await sqliteDb.run("INSERT INTO admin_config (key_name, value_data) VALUES ('activeComune', 'naro')");
          await sqliteDb.run("INSERT INTO admin_config (key_name, value_data) VALUES ('siteName', 'Comune di Naro')");
          await sqliteDb.run("INSERT INTO admin_config (key_name, value_data) VALUES ('siteLogo', '')");
        }

        // Popola operatività SQLite
        const countSeg = await sqliteDb.get('SELECT count(*) as c FROM segnalazioni');
        if (countSeg.c === 0) {
          for (const item of listSegnalazioniDemo) {
            await sqliteDb.run(`
              INSERT INTO segnalazioni (id, comune_key, codice_tracking, specie, condizioni, descrizione, foto_url, latitudine, longitudine, indirizzo, stato, urgenza, email_segnalante, nome_segnalante, consenso_privacy)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              item.id, item.comune_key, item.codice_tracking, item.specie, item.condizioni, item.descrizione, item.foto_url, item.latitudine, item.longitudine, item.indirizzo, item.stato, item.urgenza, "segnalante@test.it", "Demo User", 1
            ]);
          }
        }

        const countReg = await sqliteDb.get('SELECT count(*) as c FROM registro_anagrafica');
        if (countReg.c === 0) {
          for (const item of listRegistroDemo) {
            await sqliteDb.run(`
              INSERT INTO registro_anagrafica (microchip, comune_key, nome, specie, sesso, taglia, colore, condizioni_sanitarie, stato, foto_url)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              item.microchip, item.comune_key, item.nome, item.specie, item.sesso, item.taglia, item.colore, item.condizioni_sanitarie, item.stato, item.foto_url
            ]);
          }
        }

        const countLog = await sqliteDb.get('SELECT count(*) as c FROM interventi_logs');
        if (countLog.c === 0) {
          let logId = 1;
          for (const item of listLogsDemo) {
            await sqliteDb.run(`
              INSERT INTO interventi_logs (id, comune_key, segnalazione_codice, operatore, azione, note)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [
              logId++, item.comune_key, item.report_id, item.operatore, item.descrizione, item.note
            ]);
          }
        }

        const countStr = await sqliteDb.get('SELECT count(*) as c FROM strutture');
        if (countStr.c === 0) {
          for (const item of listStruttureDemo) {
            await sqliteDb.run(`
              INSERT INTO strutture (comune_key, nome, tipo, indirizzo, telefono, capacita_max, postazioni_occupate)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              item.comune_key, item.nome, item.tipo, item.indirizzo, item.telefono, item.capacita_max, item.postazioni_occupate
            ]);
          }
        }

        console.log("SQLite: presetting reference & demo data completato.");
      } catch (err) {
        console.error("Errore popolamento SQLite reference/demo values:", err);
      }
    }

    // Seeding MySQL Reference & Demo Values Symmetrically
    if (getIsMysqlHealthy() && mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.execute('SELECT count(*) as c FROM comuni');
        if (rows[0].c === 0) {
          for (const item of listComuni) {
            await mysqlPool.execute('INSERT IGNORE INTO comuni (key_name, name, lat, lng, radius_km, lat_min, lat_max, lng_min, lng_max) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
              item.key, item.name, item.lat, item.lng, item.radius_km, item.lat_min, item.lat_max, item.lng_min, item.lng_max
            ]);
          }
          console.log("MySQL: inseriti comuni con successo!");
        }

        const [rowsRuoli]: any = await mysqlPool.execute('SELECT count(*) as c FROM ruoli_operatore');
        if (rowsRuoli[0].c === 0) {
          for (const item of listRuoli) {
            await mysqlPool.execute('INSERT IGNORE INTO ruoli_operatore (ruolo_key, descrizione) VALUES (?, ?)', [item.key, item.desc]);
          }
        }

        const [rowsTipologie]: any = await mysqlPool.execute('SELECT count(*) as c FROM tipologie_animali');
        if (rowsTipologie[0].c === 0) {
          for (const item of listTipologie) {
            await mysqlPool.execute('INSERT IGNORE INTO tipologie_animali (specie_key, descrizione) VALUES (?, ?)', [item.key, item.desc]);
          }
        }

        // Carica activeComune, siteName, siteLogo se mancanti
        const [activeComuneRows]: any = await mysqlPool.execute("SELECT count(*) as c FROM admin_config WHERE key_name = 'activeComune'");
        if (activeComuneRows[0].c === 0) {
          await mysqlPool.execute("INSERT IGNORE INTO admin_config (key_name, value_data) VALUES ('activeComune', 'naro')");
          await mysqlPool.execute("INSERT IGNORE INTO admin_config (key_name, value_data) VALUES ('siteName', 'Comune di Naro')");
          await mysqlPool.execute("INSERT IGNORE INTO admin_config (key_name, value_data) VALUES ('siteLogo', '')");
        }

        const [rowsSeg]: any = await mysqlPool.execute('SELECT count(*) as c FROM segnalazioni');
        if (rowsSeg[0].c === 0) {
          for (const item of listSegnalazioniDemo) {
            await mysqlPool.execute(`
              INSERT IGNORE INTO segnalazioni (id, comune_key, codice_tracking, specie, condizioni, descrizione, foto_url, latitudine, longitudine, indirizzo, stato, urgenza, email_segnalante, nome_segnalante, consenso_privacy)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              item.id, item.comune_key, item.codice_tracking, item.specie, item.condizioni, item.descrizione, item.foto_url, item.latitudine, item.longitudine, item.indirizzo, item.stato, item.urgenza, "segnalante@test.it", "Demo User", 1
            ]);
          }
        }

        const [rowsReg]: any = await mysqlPool.execute('SELECT count(*) as c FROM registro_anagrafica');
        if (rowsReg[0].c === 0) {
          for (const item of listRegistroDemo) {
            await mysqlPool.execute(`
              INSERT IGNORE INTO registro_anagrafica (microchip, comune_key, nome, specie, sesso, taglia, colore, condizioni_sanitarie, stato, foto_url)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              item.microchip, item.comune_key, item.nome, item.specie, item.sesso, item.taglia, item.colore, item.condizioni_sanitarie, item.stato, item.foto_url
            ]);
          }
        }

        const [rowsLog]: any = await mysqlPool.execute('SELECT count(*) as c FROM interventi_logs');
        if (rowsLog[0].c === 0) {
          let logId = 1;
          for (const item of listLogsDemo) {
            await mysqlPool.execute(`
              INSERT IGNORE INTO interventi_logs (id, comune_key, segnalazione_codice, operatore, azione, note)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [
              logId++, item.comune_key, item.report_id, item.operatore, item.descrizione, item.note
            ]);
          }
        }

        const [rowsStrutture]: any = await mysqlPool.execute('SELECT count(*) as c FROM strutture');
        if (rowsStrutture[0].c === 0) {
          for (const item of listStruttureDemo) {
            await mysqlPool.execute(`
              INSERT IGNORE INTO strutture (comune_key, nome, tipo, indirizzo, telefono, capacita_max, postazioni_occupate)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              item.comune_key, item.nome, item.tipo, item.indirizzo, item.telefono, item.capacita_max, item.postazioni_occupate
            ]);
          }
        }

        console.log("MySQL: presetting reference & demo data completato.");
      } catch (err) {
        console.error("Errore popolamento MySQL reference/demo values, ignorato:", err);
      }
    }

    // Riscaldamento/Sincronizzazione Firestore all'avvio
    if (db) {
      try {
        let activeKey = "naro";
        if (getIsMysqlHealthy() && mysqlPool) {
          const [confRows]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
          if (confRows && confRows[0]) activeKey = confRows[0].value_data;
        } else if (sqliteDb) {
          const confRow = await sqliteDb.get("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
          if (confRow) activeKey = confRow.value_data;
        }

        console.log(`Riscaldamento Firestore per il comune attivo: ${activeKey}...`);
        
        let activeReports: any[] = [];
        if (getIsMysqlHealthy() && mysqlPool) {
          const [reps]: any = await mysqlPool.execute("SELECT * FROM segnalazioni WHERE comune_key = ?", [activeKey]);
          activeReports = reps || [];
        } else if (sqliteDb) {
          activeReports = await sqliteDb.all("SELECT * FROM segnalazioni WHERE comune_key = ?", [activeKey]);
        }

        if (activeReports.length > 0) {
          // Pulisci collezione 'segnalazioni' su Firestore
          const snapshot = await db.collection("segnalazioni").get();
          const batch = db.batch();
          snapshot.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();

          // Sincronizza i report del comune attivo
          const initBatch = db.batch();
          for (const rep of activeReports) {
            const tracking = rep.codice_tracking || rep.codiceTracking;
            const docRef = db.collection("segnalazioni").doc(tracking);
            initBatch.set(docRef, {
              relationalId: rep.id,
              comuneKey: activeKey,
              codiceTracking: tracking,
              specie: rep.specie,
              condizioni: rep.condizioni,
              descrizione: rep.descrizione,
              fotoUrl: rep.foto_url || rep.fotoUrl,
              latitudine: rep.latitudine,
              longitudine: rep.longitudine,
              indirizzo: rep.indirizzo,
              stato: rep.stato,
              urgenza: rep.urgenza,
              nomeSegnalante: rep.nome_segnalante || "Demo User",
              emailSegnalante: rep.email_segnalante || "segnalante@test.it",
              createdAt: rep.created_at ? new Date(rep.created_at) : new Date(),
              updatedAt: rep.updated_at ? new Date(rep.updated_at) : new Date()
            });
          }
          await initBatch.commit();
          console.log(`Allineamento Firestore completato! ${activeReports.length} segnalazioni storiche sincronizzate.`);
        }
      } catch (fe) {
        console.error("Errore durante il riscaldamento/allineamento cache Firestore:", fe);
      }
    }
  }

  // Esegui la funzione di seed
  await seedDatabaseReferenceAndPresets();

  // AI Chat Route Helper
  async function getActiveSiteName(): Promise<string> {
    let siteName = "Comune di Naro";
    if (getIsMysqlHealthy() && mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query("SELECT value_data FROM admin_config WHERE key_name = 'siteName'");
        if (rows && rows[0]) {
          siteName = rows[0].value_data;
        }
      } catch (err) {}
    } else if (sqliteDb) {
      try {
        const row = await sqliteDb.get("SELECT value_data FROM admin_config WHERE key_name = 'siteName'");
        if (row) {
          siteName = row.value_data;
        }
      } catch (err) {}
    }
    return siteName;
  }

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      const activeName = await getActiveSiteName();
      const genAI = getGenAI();
      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: messages,
        config: {
          systemInstruction: `Sei un assistente AI specializzato nella tutela animale e gestione randagismo per il ${activeName} e la regione Sicilia. ` +
            "Il sistema si chiama AnimalHub PA. " +
            "Rispondi in italiano in modo eccezionalmente professionale, autorevole, cortese e strutturato. " +
            "Conosci le leggi regionali siciliane sul randagismo (L.R. 15/2000) e il benessere degli animali d'affezione. " +
            "Se l'utente chiede come creare una segnalazione, guidalo ad andare alla sezione 'Segnala' del portale corrente. " +
            `Qualora segnalassero ferimenti critici o emergenze di pubblica sicurezza legate ad animali vaganti, esorta l'utente a contattare immediatamente il 112 o il centralino della Polizia Municipale locale del ${activeName}.`
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

      if (getIsMysqlHealthy() && mysqlPool) {
        try {
          const [rows]: any = await mysqlPool.execute("SELECT * FROM admin_users WHERE username = ?", [username]);
          user = rows[0];
        } catch (err) {
          console.error("Errore query MySQL login, applico fallback su SQLite:", err);
          setMysqlHealthy(false);
          user = await sqliteDb.get("SELECT * FROM admin_users WHERE username = ?", [username]);
        }
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
        sameSite: "strict",
        maxAge: 8 * 60 * 60 * 1000 // 8 ore
      });

      res.json({ success: true, user: { username: user.username, role: user.role } });
    } catch (error: any) {
      console.error("POST login error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie("admin_token");
    res.json({ success: true });
  });

  app.get("/api/admin/me", (req, res) => {
    try {
      const token = req.cookies.admin_token;
      if (!token) return res.status(401).json({ error: "Non autorizzato" });
      const decoded: any = jwt.verify(token, JWT_SECRET);
      res.json({ user: { username: decoded.username, role: decoded.role } });
    } catch (err) {
      res.status(401).json({ error: "Token non valido o scaduto" });
    }
  });

  // Setup Segnalazioni Router
  app.use("/api/segnalazioni", segnalazioniRouter);

  // Endpoint per GET e POST della configurazione admin
  app.get("/api/admin/config", async (req, res) => {
    try {
      let config: Record<string, string> = {};
      if (getIsMysqlHealthy() && mysqlPool) {
        try {
          const [rows] = await mysqlPool.query<any>("SELECT * FROM admin_config");
          rows.forEach((r: any) => { config[r.key_name] = r.value_data; });
        } catch (err) {
          console.error("Errore query MySQL config GET, applico fallback su SQLite:", err);
          setMysqlHealthy(false);
          const rows = await sqliteDb.all("SELECT * FROM admin_config");
          rows.forEach((r: any) => { config[r.key_name] = r.value_data; });
        }
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

      const { siteName, siteLogo, activeComune } = req.body;
      let usedSqlite = true;
      if (getIsMysqlHealthy() && mysqlPool) {
        try {
          await mysqlPool.execute(
            "INSERT INTO admin_config (key_name, value_data) VALUES ('siteName', ?) ON DUPLICATE KEY UPDATE value_data = ?",
            [siteName || "Comune di Naro", siteName || "Comune di Naro"]
          );
          await mysqlPool.execute(
            "INSERT INTO admin_config (key_name, value_data) VALUES ('siteLogo', ?) ON DUPLICATE KEY UPDATE value_data = ?",
            [siteLogo || "", siteLogo || ""]
          );
          if (activeComune) {
            await mysqlPool.execute(
              "INSERT INTO admin_config (key_name, value_data) VALUES ('activeComune', ?) ON DUPLICATE KEY UPDATE value_data = ?",
              [activeComune.toLowerCase(), activeComune.toLowerCase()]
            );
          }
          usedSqlite = false;
        } catch (err) {
          console.error("Errore query MySQL config POST, applico fallback su SQLite:", err);
          setMysqlHealthy(false);
        }
      }
      
      if (usedSqlite) {
        await sqliteDb.run(
          "INSERT INTO admin_config (key_name, value_data) VALUES ('siteName', ?) ON CONFLICT(key_name) DO UPDATE SET value_data = ?",
          [siteName || "Comune di Naro", siteName || "Comune di Naro"]
        );
        await sqliteDb.run(
          "INSERT INTO admin_config (key_name, value_data) VALUES ('siteLogo', ?) ON CONFLICT(key_name) DO UPDATE SET value_data = ?",
          [siteLogo || "", siteLogo || ""]
        );
        if (activeComune) {
          await sqliteDb.run(
            "INSERT INTO admin_config (key_name, value_data) VALUES ('activeComune', ?) ON CONFLICT(key_name) DO UPDATE SET value_data = ?",
            [activeComune.toLowerCase(), activeComune.toLowerCase()]
          );
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("POST config error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stateful, unifed switch handler
  app.post("/api/admin/demo-switch", async (req, res) => {
    try {
      const { municipality } = req.body;
      if (!municipality) return res.status(400).json({ error: "Comune non specificato" });

      const normMuni = municipality.toLowerCase();
      
      const configMap: Record<string, { siteName: string; siteLogo: string }> = {
        naro: { siteName: "Comune di Naro", siteLogo: "" },
        agrigento: { siteName: "Comune di Agrigento", siteLogo: "" },
        canicatti: { siteName: "Comune di Canicattì", siteLogo: "" },
        favara: { siteName: "Comune di Favara", siteLogo: "" },
        palermo: { siteName: "Comune di Palermo", siteLogo: "" }
      };

      const selConfig = configMap[normMuni] || configMap.naro;

      // 1. Modifica la configurazione attiva (activeComune, siteName, siteLogo) nel Database Relazionale
      let usedSqlite = true;
      if (getIsMysqlHealthy() && mysqlPool) {
        try {
          await mysqlPool.execute(
            "INSERT INTO admin_config (key_name, value_data) VALUES ('activeComune', ?) ON DUPLICATE KEY UPDATE value_data = ?",
            [normMuni, normMuni]
          );
          await mysqlPool.execute(
            "INSERT INTO admin_config (key_name, value_data) VALUES ('siteName', ?) ON DUPLICATE KEY UPDATE value_data = ?",
            [selConfig.siteName, selConfig.siteName]
          );
          await mysqlPool.execute(
            "INSERT INTO admin_config (key_name, value_data) VALUES ('siteLogo', ?) ON DUPLICATE KEY UPDATE value_data = ?",
            [selConfig.siteLogo, selConfig.siteLogo]
          );
          usedSqlite = false;
        } catch (err) {
          console.error("Errore query MySQL config update, fallback su SQLite:", err);
          setMysqlHealthy(false);
        }
      }
      
      if (usedSqlite) {
        await sqliteDb.run(
          "INSERT INTO admin_config (key_name, value_data) VALUES ('activeComune', ?) ON CONFLICT(key_name) DO UPDATE SET value_data = ?",
          [normMuni, normMuni]
        );
        await sqliteDb.run(
          "INSERT INTO admin_config (key_name, value_data) VALUES ('siteName', ?) ON CONFLICT(key_name) DO UPDATE SET value_data = ?",
          [selConfig.siteName, selConfig.siteName]
        );
        await sqliteDb.run(
          "INSERT INTO admin_config (key_name, value_data) VALUES ('siteLogo', ?) ON CONFLICT(key_name) DO UPDATE SET value_data = ?",
          [selConfig.siteLogo, selConfig.siteLogo]
        );
      }

      // 2. Estrae tutti i report storici memorizzati nel DB relativi al comune selezionato
      let selectedReports: any[] = [];
      if (getIsMysqlHealthy() && mysqlPool) {
        try {
          const [reports]: any = await mysqlPool.execute("SELECT * FROM segnalazioni WHERE comune_key = ?", [normMuni]);
          selectedReports = reports || [];
        } catch (err) {
          console.error("Errore lettura segnalazioni da MySQL, fallback su SQLite:", err);
        }
      }

      if (selectedReports.length === 0 && sqliteDb) {
        try {
          selectedReports = await sqliteDb.all("SELECT * FROM segnalazioni WHERE comune_key = ?", [normMuni]);
        } catch (err) {
          console.error("Errore query SQLite segnalazioni:", err);
        }
      }

      // 3. Svuota la collezione real-time Firestore ed inserisce esclusivamente i record del comune corrente
      if (db) {
        try {
          const snapshot = await db.collection("segnalazioni").get();
          const batch = db.batch();
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();

          if (selectedReports.length > 0) {
            const repBatch = db.batch();
            for (const rep of selectedReports) {
              const tracking = rep.codice_tracking || rep.codiceTracking;
              const docRef = db.collection("segnalazioni").doc(tracking);
              repBatch.set(docRef, {
                relationalId: rep.id,
                comuneKey: normMuni,
                codiceTracking: tracking,
                specie: rep.specie,
                condizioni: rep.condizioni,
                descrizione: rep.descrizione,
                fotoUrl: rep.foto_url || rep.fotoUrl,
                latitudine: rep.latitudine,
                longitudine: rep.longitudine,
                indirizzo: rep.indirizzo,
                stato: rep.stato,
                urgenza: rep.urgenza,
                nomeSegnalante: rep.nome_segnalante || "Demo User",
                emailSegnalante: rep.email_segnalante || "segnalante@test.it",
                createdAt: rep.created_at ? new Date(rep.created_at) : new Date(),
                updatedAt: rep.updated_at ? new Date(rep.updated_at) : new Date()
              });
            }
            await repBatch.commit();
          }
        } catch (e) {
          console.error("Errore sincronizzazione Firestore in demo-switch:", e);
        }
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error("Demo Switch Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/registro", async (req, res) => {
    try {
      let list = [];
      const activeMuni = await getActiveComuneKeyServer(sqliteDb);
      if (getIsMysqlHealthy() && mysqlPool) {
        try {
          const [rows] = await mysqlPool.query<any>(
            "SELECT * FROM registro_anagrafica WHERE comune_key = ? ORDER BY data_registrazione DESC",
            [activeMuni]
          );
          list = rows;
        } catch (err) {
          console.error("Errore query MySQL registro GET, applico fallback su SQLite:", err);
          setMysqlHealthy(false);
          const rows = await sqliteDb.all(
            "SELECT * FROM registro_anagrafica WHERE comune_key = ? ORDER BY data_registrazione DESC",
            [activeMuni]
          );
          list = rows;
        }
      } else {
        const rows = await sqliteDb.all(
          "SELECT * FROM registro_anagrafica WHERE comune_key = ? ORDER BY data_registrazione DESC",
          [activeMuni]
        );
        list = rows;
      }
      
      const mapped = list.map((r: any) => ({
        id: r.id,
        microchip: r.microchip,
        comuneKey: r.comune_key,
        nome: r.nome,
        specie: r.specie,
        sesso: r.sesso,
        taglia: r.taglia,
        colore: r.colore,
        condizioniSanitarie: r.condizioni_sanitarie,
        stato: r.stato,
        fotoUrl: r.foto_url,
        dataRegistrazione: r.data_registrazione
      }));

      res.json(mapped);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/registro", async (req, res) => {
    try {
      const { microchip, nome, specie, sesso, taglia, colore, condizioniSanitarie, fotoUrl, stato } = req.body;
      const activeMuni = await getActiveComuneKeyServer(sqliteDb);
      let sqlId = 0;
      let usedSqlite = true;
      if (getIsMysqlHealthy() && mysqlPool) {
        try {
          const [result] = await mysqlPool.execute<any>(`
            INSERT INTO registro_anagrafica (microchip, comune_key, nome, specie, sesso, taglia, colore, condizioni_sanitarie, stato, foto_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [microchip, activeMuni, nome, specie, sesso, taglia, colore, condizioniSanitarie, stato, fotoUrl]);
          sqlId = result.insertId;
          usedSqlite = false;
        } catch (err) {
          console.error("Errore query MySQL registro POST, applico fallback su SQLite:", err);
          setMysqlHealthy(false);
        }
      }
      
      if (usedSqlite) {
        const result = await sqliteDb.run(`
          INSERT INTO registro_anagrafica (microchip, comune_key, nome, specie, sesso, taglia, colore, condizioni_sanitarie, stato, foto_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [microchip, activeMuni, nome, specie, sesso, taglia, colore, condizioniSanitarie, stato, fotoUrl]);
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
      let usedSqlite = true;
      if (getIsMysqlHealthy() && mysqlPool) {
        try {
          await mysqlPool.execute(`
            UPDATE registro_anagrafica 
            SET microchip=?, nome=?, specie=?, sesso=?, taglia=?, colore=?, condizioni_sanitarie=?, stato=?, foto_url=?
            WHERE id=?
          `, [microchip, nome, specie, sesso, taglia, colore, condizioniSanitarie, stato, fotoUrl, id]);
          usedSqlite = false;
        } catch (err) {
          console.error("Errore query MySQL registro PUT, applico fallback su SQLite:", err);
          setMysqlHealthy(false);
        }
      }
      
      if (usedSqlite) {
        await sqliteDb.run(`
          UPDATE registro_anagrafica 
          SET microchip=?, nome=?, specie=?, sesso=?, taglia=?, colore=?, condizioni_sanitarie=?, stato=?, foto_url=?
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
      const activeMuni = await getActiveComuneKeyServer(sqliteDb);

      let list = [];
      let totalCount = 0;

      if (getIsMysqlHealthy() && mysqlPool) {
        try {
          const [countRows]: any = await mysqlPool.query(
            "SELECT COUNT(*) as c FROM interventi_logs WHERE comune_key = ?",
            [activeMuni]
          );
          totalCount = countRows[0]?.c || 0;

          const [rows] = await mysqlPool.query<any>(
            `SELECT id, segnalazione_codice as reportId, operatore, azione as descrizione, note as assegnatoA, timestamp as data FROM interventi_logs 
             WHERE comune_key = ? 
             ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
            [activeMuni, limit, offset]
          );
          list = rows;
        } catch (err) {
          console.error("Errore query MySQL interventi_logs GET, applico fallback su SQLite:", err);
          setMysqlHealthy(false);
          const countRow = await sqliteDb.get("SELECT COUNT(*) as c FROM interventi_logs WHERE comune_key = ?", [activeMuni]);
          totalCount = countRow?.c || 0;

          const rows = await sqliteDb.all(
            `SELECT id, segnalazione_codice as reportId, operatore, azione as descrizione, note as assegnatoA, timestamp as data FROM interventi_logs 
             WHERE comune_key = ? 
             ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
            [activeMuni, limit, offset]
          );
          list = rows;
        }
      } else {
        const countRow = await sqliteDb.get("SELECT COUNT(*) as c FROM interventi_logs WHERE comune_key = ?", [activeMuni]);
        totalCount = countRow?.c || 0;

        const rows = await sqliteDb.all(
          `SELECT id, segnalazione_codice as reportId, operatore, azione as descrizione, note as assegnatoA, timestamp as data FROM interventi_logs 
           WHERE comune_key = ? 
           ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
          [activeMuni, limit, offset]
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

      if (getIsMysqlHealthy() && mysqlPool) {
        try {
          const [rows] = await mysqlPool.query("SELECT * FROM segnalazioni LIMIT 5");
          mysqlStatus = "Connesso (Aruba)";
          mysqlData = rows;
        } catch (err: any) {
          mysqlStatus = "Errore di connessione o query (Aruba)";
          mysqlError = err.message;
          setMysqlHealthy(false);
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
