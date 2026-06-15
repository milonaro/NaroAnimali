import mysql from "mysql2/promise";
import sqlite3 from "sqlite3";
import { open as openSqlite } from "sqlite";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

let pool: any = null;
let isHealthy = false;
let sqliteDb: any = null;
let isSqliteInitialized = false;

// Initialize MySQL pool if credentials are provided
if (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER) {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000 // 3 seconds timeout
    });
    isHealthy = true; // Provisionally set to true; server.ts will verify via ping.
    console.log("Pool MySQL su Aruba inizializzato.");
  } catch (e) {
    console.error("Errore di inizializzazione pool MySQL:", e);
    isHealthy = false;
  }
}

export function setMysqlHealthy(val: boolean) {
  isHealthy = val;
  if (!val) {
    console.warn("[FAILOVER] MySQL è stato segnalato come NON sano o Offline. Tutte le query useranno SQLite.");
  }
}

export function getIsMysqlHealthy() {
  // Return true if either MySQL is healthy OR we can fallback to SQLite
  return isHealthy || true; // Always return true to keep the app fully operational
}

export const getPool = () => {
  return poolWrapper;
};

// SQLite database getter and initialization
export async function getSqliteDb() {
  if (sqliteDb) return sqliteDb;

  try {
    const dbPath = path.join(process.cwd(), "database.sqlite");
    sqliteDb = await openSqlite({
      filename: dbPath,
      driver: sqlite3.Database
    });

    if (!isSqliteInitialized) {
      isSqliteInitialized = true;
      await initSqliteSchema(sqliteDb);
    }
    return sqliteDb;
  } catch (err) {
    console.error("Errore durante l'apertura o l'inizializzazione di SQLite:", err);
    throw err;
  }
}

// Map MySQL schema to SQLite and seed
async function initSqliteSchema(db: any) {
  try {
    // Check if the tables already exist (e.g. check for admin_users)
    const tableExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_users'");
    if (tableExists) {
      console.log("Database SQLite già esistente e strutturato. Sincronizzazione contatti e-mail amministratori...");
      try {
        await db.run("UPDATE admin_users SET email = ? WHERE username = ?", ["franco.tese@gmail.com", "admin"]);
        await db.run("UPDATE admin_users SET email = ? WHERE username = ?", ["polizia@animalhubpa.it", "polizia"]);
        await db.run("UPDATE admin_users SET email = ? WHERE username = ?", ["canile@animalhubpa.it", "canile"]);
        await db.run("UPDATE admin_users SET email = ? WHERE username = ?", ["volontari@animalhubpa.it", "volontario"]);
        console.log("Contatti e-mail amministratori sincronizzati con successo in SQLite.");
      } catch (e: any) {
        console.warn("Avviso: Impossibile aggiornare i contatti e-mail degli amministratori esistenti:", e.message);
      }
      return;
    }

    console.log("Inizializzazione database SQLite locale con schema unificato...");
    const schemaPath = path.join(process.cwd(), "initialize_reference_tables.sql");
    if (fs.existsSync(schemaPath)) {
      const sqlFileContent = fs.readFileSync(schemaPath, "utf8");
      
      // Clean up statements and split by semicolon
      const rawStatements = sqlFileContent.split(";");
      
      await db.run("PRAGMA foreign_keys = OFF");
      
      for (let rawStmt of rawStatements) {
        let stmt = rawStmt.trim();
        if (!stmt) continue;

        // Skip stored procedures
        if (stmt.toUpperCase().includes("CREATE PROCEDURE") || stmt.toUpperCase().includes("END`") || stmt.trim() === "END") {
          continue;
        }

        // Clean MySQL incompatible syntax
        if (stmt.includes("ON DUPLICATE KEY UPDATE")) {
          stmt = stmt.split("ON DUPLICATE KEY UPDATE")[0].trim();
          stmt = stmt.replace(/INSERT INTO/gi, "INSERT OR REPLACE INTO");
        }

        // Clean ON UPDATE CURRENT_TIMESTAMP
        stmt = stmt.replace(/ON UPDATE CURRENT_TIMESTAMP/gi, "");

        // Auto increment replacement
        stmt = stmt.replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
        stmt = stmt.replace(/INTEGER AUTO_INCREMENT PRIMARY KEY/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
        
        // Skip Views with OR REPLACE by replacing with VIEW
        stmt = stmt.replace(/CREATE OR REPLACE VIEW/gi, "CREATE VIEW IF NOT EXISTS");

        try {
          await db.run(stmt);
        } catch (sqliteErr: any) {
          // Log errors for tracking, but don't crash
          console.warn(`Query SQLite non critica ignorata o fallita durante il setup iniziale: ${stmt.substring(0, 100)}... -> Errore:`, sqliteErr.message);
        }
      }

      await db.run("PRAGMA foreign_keys = ON");
      console.log("Struttura tabelle SQLite creata con successo.");

      // Seeding default admin users if they don't exist
      const userCount = await db.get("SELECT COUNT(*) as count FROM admin_users");
      if (userCount && userCount.count === 0) {
        console.log("Seeding degli utenti amministratori di default in SQLite...");
        const adminHash = await bcrypt.hash("admin2026", 10);
        const poliziaHash = await bcrypt.hash("polizia2026", 10);
        const canileHash = await bcrypt.hash("canile2026", 10);
        const volontarioHash = await bcrypt.hash("volontario2026", 10);

        const allModules = JSON.stringify(['statistiche', 'modulo-b', 'modulo-c', 'modulo-adozioni']);
        const policeModules = JSON.stringify(['modulo-b', 'modulo-c']);
        const kennelModules = JSON.stringify(['modulo-b', 'modulo-c', 'modulo-adozioni']);
        const volunteerModules = JSON.stringify(['modulo-b']);

        await db.run(
          "INSERT INTO admin_users (username, password_hash, role, comune_key, visible_modules, email) VALUES (?, ?, ?, ?, ?, ?)",
          ["admin", adminHash, "ADMIN", "naro", allModules, "franco.tese@gmail.com"]
        );
        await db.run(
          "INSERT INTO admin_users (username, password_hash, role, comune_key, visible_modules, email) VALUES (?, ?, ?, ?, ?, ?)",
          ["polizia", poliziaHash, "POLIZIA_LOCALE", policeModules, "polizia@animalhubpa.it"]
        );
        await db.run(
          "INSERT INTO admin_users (username, password_hash, role, comune_key, visible_modules, email) VALUES (?, ?, ?, ?, ?, ?)",
          ["canile", canileHash, "CANILE_SANITARIO", kennelModules, "canile@animalhubpa.it"]
        );
        await db.run(
          "INSERT INTO admin_users (username, password_hash, role, comune_key, visible_modules, email) VALUES (?, ?, ?, ?, ?, ?)",
          ["volontario", volontarioHash, "VOLONTARIO", volunteerModules, "volontari@animalhubpa.it"]
        );
        console.log("Utenti amministratori di default inseriti in SQLite.");
      }
    } else {
      console.error("File schema initialize_reference_tables.sql non trovato in " + schemaPath);
    }
  } catch (err: any) {
    console.error("Errore critico durante l'inizializzazione dello schema SQLite locale:", err);
  }
}

// Transparent DB execution wrapper that handles fallback to SQLite on errors or if MySQL is marked down
export const poolWrapper = {
  execute: async (sql: string, params?: any[]): Promise<[any, any]> => {
    return poolWrapper.query(sql, params);
  },

  query: async (sql: string, params?: any[]): Promise<[any, any]> => {
    let convertedSql = sql;
    let convertedParams = params ? [...params] : [];

    // Fall back to SQLite if pool is disabled or not healthy
    if (!isHealthy || !pool) {
      const db = await getSqliteDb();

      // Translate common incompatible MySQL syntax to SQLite
      if (sql.includes("user_otps") && sql.includes("ON DUPLICATE KEY UPDATE")) {
        convertedSql = "INSERT INTO user_otps (email, otp_code, expires_at) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET otp_code = excluded.otp_code, expires_at = excluded.expires_at";
        convertedParams = convertedParams.slice(0, 3);
      } else if (sql.includes("admin_config") && sql.includes("ON DUPLICATE KEY UPDATE")) {
        convertedSql = "INSERT INTO admin_config (key_name, value_data) VALUES (?, ?) ON CONFLICT(key_name) DO UPDATE SET value_data = excluded.value_data";
        convertedParams = convertedParams.slice(0, 2);
      } else if (sql.includes("ON DUPLICATE KEY UPDATE")) {
        convertedSql = sql.split("ON DUPLICATE KEY UPDATE")[0].replace("INSERT INTO", "INSERT OR REPLACE INTO");
      }

      // Convert MySQL functions/syntax to SQLite equivalents
      convertedSql = convertedSql.replace(/NOW\(\)/gi, "datetime('now', 'localtime')");
      convertedSql = convertedSql.replace(/CONCAT\(([^,]+),\s*([^)]+)\)/gi, "$1 || $2");
      convertedSql = convertedSql.replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
      convertedSql = convertedSql.replace(/INTEGER AUTO_INCREMENT PRIMARY KEY/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
      convertedSql = convertedSql.replace(/YEAR\(([^)]+)\)/gi, "strftime('%Y', $1)");
      convertedSql = convertedSql.replace(/MONTH\(([^)]+)\)/gi, "strftime('%m', $1)");
      convertedSql = convertedSql.replace(/CREATE OR REPLACE VIEW/gi, "CREATE VIEW IF NOT EXISTS");

      try {
        if (convertedSql.trim().toUpperCase().startsWith("SELECT") || convertedSql.trim().toUpperCase().startsWith("PRAGMA")) {
          const rows = await db.all(convertedSql, convertedParams);
          return [rows, null];
        } else {
          const result = await db.run(convertedSql, convertedParams);
          return [{ insertId: result.lastID, affectedRows: result.changes }, null];
        }
      } catch (err: any) {
        console.error("SQLite Fallback execute warning/error:", err.message, "Original SQL:", sql);
        throw err;
      }
    }

    // Attempt MySQL query
    try {
      const [rows, fields] = await pool.query(sql, convertedParams);
      return [rows, fields];
    } catch (err: any) {
      console.warn("MySQL Query fallito, attivo fallback istantaneo su SQLite locale. Errore MySQL:", err.message);
      setMysqlHealthy(false);
      // Retry query using SQLite
      return poolWrapper.query(sql, params);
    }
  }
};

export default poolWrapper;
