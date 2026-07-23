import mysql from "mysql2/promise";
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
    const isVercel = process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    let dbPath = path.join(process.cwd(), "database.sqlite");

    if (isVercel) {
      dbPath = "/tmp/database.sqlite";
      try {
        const sourcePath = path.join(process.cwd(), "database.sqlite");
        if (fs.existsSync(sourcePath) && !fs.existsSync(dbPath)) {
          fs.copyFileSync(sourcePath, dbPath);
          console.log("[VERCEL SF] Copiato database.sqlite iniziale in /tmp!");
        }
      } catch (copyErr: any) {
        console.warn("[VERCEL SF] Errore copia sqlite in /tmp:", copyErr.message);
      }
    }

    try {
      const sqlite3Module = await import("sqlite3");
      const sqliteModule = await import("sqlite");

      sqliteDb = await sqliteModule.open({
        filename: dbPath,
        driver: sqlite3Module.default.Database
      });

      if (!isSqliteInitialized) {
        isSqliteInitialized = true;
        await initSqliteSchema(sqliteDb);
      }
    } catch (sqliteLoadErr: any) {
      console.warn("[FAILOVER] Caricamento SQLite fallito (previsto su Vercel Serverless). Attivazione Virtual JSON Database...", sqliteLoadErr.message);
      sqliteDb = new VirtualJsonDb() as any;
      if (!isSqliteInitialized) {
        isSqliteInitialized = true;
        await initSqliteSchema(sqliteDb);
      }
    }

    return sqliteDb;
  } catch (err) {
    console.error("Errore generico durante l'apertura o l'inizializzazione di SQLite:", err);
    throw err;
  }
}

// Virtual JSON Database fallback for Vercel Serverless environment where native sqlite3 binary can't load
class VirtualJsonDb {
  tables: Record<string, any[]> = {};

  constructor() {
    this.tables = loadVirtualDb() || {};
  }

  async get(sql: string, params?: any[]): Promise<any> {
    const results = await this.all(sql, params);
    return results[0] || null;
  }

  filterAndPush(tableName: string, row: Record<string, any>) {
    if (tableName === "user_otps" && row.email) {
      this.tables[tableName] = this.tables[tableName].filter(r => r.email !== row.email);
    } else if (tableName === "admin_config" && row.key_name) {
      this.tables[tableName] = this.tables[tableName].filter(r => r.key_name !== row.key_name);
    } else if (tableName === "comuni" && row.key_name) {
      this.tables[tableName] = this.tables[tableName].filter(r => r.key_name !== row.key_name);
    } else if (tableName === "admin_users" && row.username) {
      this.tables[tableName] = this.tables[tableName].filter(r => r.username !== row.username);
    } else if (row.id) {
      this.tables[tableName] = this.tables[tableName].filter(r => r.id !== row.id);
    }
    this.tables[tableName].push(row);
  }

  async run(sql: string, params?: any[]): Promise<any> {
    const upper = sql.trim().toUpperCase();
    if (upper.startsWith("CREATE TABLE")) {
      const match = sql.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-zA-Z0-9_]+)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        if (!this.tables[tableName]) {
          this.tables[tableName] = [];
        }
      }
    } else if (upper.startsWith("INSERT")) {
      const match = sql.match(/INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES/i);
      const valuesKeyword = sql.toUpperCase().indexOf("VALUES");

      if (match && valuesKeyword !== -1) {
        const tableName = match[1].toLowerCase();
        const cols = match[2].split(",").map(c => c.trim().replace(/['"`]/g, ""));
        
        if (!this.tables[tableName]) {
          this.tables[tableName] = [];
        }

        if (params && params.length > 0) {
          const row: Record<string, any> = {};
          cols.forEach((col, idx) => {
            row[col.toLowerCase()] = params[idx];
          });
          this.filterAndPush(tableName, row);
        } else {
          const valString = sql.substring(valuesKeyword + 6).trim();
          const tuples: string[] = [];
          let currentTuple = "";
          let insideQuote = false;
          let insideTuple = false;
          
          for (let i = 0; i < valString.length; i++) {
            const char = valString[i];
            if (char === "'" && (i === 0 || valString[i-1] !== "\\")) {
              insideQuote = !insideQuote;
              currentTuple += char;
            } else if (char === "(" && !insideQuote) {
              insideTuple = true;
              currentTuple = "";
            } else if (char === ")" && !insideQuote) {
              insideTuple = false;
              tuples.push(currentTuple);
              currentTuple = "";
            } else if (insideTuple) {
              currentTuple += char;
            }
          }

          for (const tuple of tuples) {
            const values = parseSqlValues(tuple);
            const row: Record<string, any> = {};
            cols.forEach((col, idx) => {
              row[col.toLowerCase()] = values[idx];
            });
            this.filterAndPush(tableName, row);
          }
        }
      }
    } else if (upper.startsWith("UPDATE")) {
      const updateMatch = sql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([^WHERE]+)(?:\s+WHERE\s+(.+))?/i);
      if (updateMatch) {
        const tableName = updateMatch[1].toLowerCase();
        const setClause = updateMatch[2].trim();
        const whereClause = updateMatch[3] ? updateMatch[3].trim() : "";

        if (this.tables[tableName]) {
          const setParts = setClause.split(",").map(s => s.trim());
          const setMap: Record<string, any> = {};
          let pIdx = 0;
          setParts.forEach(part => {
            const [col, valExpr] = part.split("=").map(x => x.trim().replace(/['"`]/g, ""));
            const lowerCol = col.toLowerCase();
            if (valExpr === "?") {
              setMap[lowerCol] = params ? params[pIdx++] : undefined;
            } else {
              setMap[lowerCol] = valExpr.replace(/^'|'$/g, "");
            }
          });

          this.tables[tableName].forEach(row => {
            let matches = true;
            if (whereClause) {
              matches = evalWhere(row, whereClause, params ? params.slice(pIdx) : []);
            }
            if (matches) {
              Object.assign(row, setMap);
            }
          });
        }
      }
    } else if (upper.startsWith("DELETE")) {
      const match = sql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const whereClause = match[2] ? match[2].trim() : "";
        if (this.tables[tableName]) {
          if (whereClause) {
            this.tables[tableName] = this.tables[tableName].filter(row => {
              return !evalWhere(row, whereClause, params || []);
            });
          } else {
            this.tables[tableName] = [];
          }
        }
      }
    }

    saveVirtualDb(this.tables);
    return { lastID: Date.now(), changes: 1 };
  }

  async all(sql: string, params?: any[]): Promise<any[]> {
    const upper = sql.trim().toUpperCase();
    
    if (sql.includes("sqlite_master")) {
      if (this.tables["admin_users"] !== undefined) {
        return [{ name: "admin_users" }]; 
      }
      return [];
    }

    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!fromMatch) {
      if (sql.includes("SELECT NOW()") || sql.includes("SELECT datetime")) {
        return [{ now_db: new Date().toISOString().replace("T", " ").substring(0, 19) }];
      }
      return [{}];
    }

    const tableName = fromMatch[1].toLowerCase();
    let rows = this.tables[tableName] || [];

    // Filter by WHERE
    const whereMatch = sql.match(/WHERE\s+([^ORDER|GROUP|LIMIT|OFFSET]+)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      rows = rows.filter(row => evalWhere(row, whereClause, params || []));
    }

    // Sort by ORDER BY
    const orderMatch = sql.match(/ORDER\s+BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      const col = orderMatch[1].toLowerCase();
      const desc = orderMatch[2] && orderMatch[2].toUpperCase() === "DESC";
      rows = [...rows].sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        const compare = valA < valB ? -1 : 1;
        return desc ? -compare : compare;
      });
    }

    // Slice limit
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1], 10);
      rows = rows.slice(0, limit);
    }

    return rows;
  }
}

function parseSqlValues(valString: string): any[] {
  const results: any[] = [];
  let current = "";
  let insideQuote = false;
  for (let i = 0; i < valString.length; i++) {
    const char = valString[i];
    if (char === "'" && (i === 0 || valString[i-1] !== "\\")) {
      insideQuote = !insideQuote;
    } else if (char === "," && !insideQuote) {
      results.push(parseSingleValue(current.trim()));
      current = "";
    } else {
      current += char;
    }
  }
  if (current) {
    results.push(parseSingleValue(current.trim()));
  }
  return results;
}

function parseSingleValue(str: string): any {
  if (str.startsWith("'") && str.endsWith("'")) {
    return str.replace(/^'|'$/g, "").replace(/\\'/g, "'");
  }
  if (str.toLowerCase() === "null") return null;
  if (str.toLowerCase() === "true") return 1;
  if (str.toLowerCase() === "false") return 0;
  if (/^\d+(\.\d+)?$/.test(str)) return Number(str);
  return str;
}

function evalWhere(row: any, clause: string, params: any[]): boolean {
  const cleanClause = clause.replace(/\s+/g, " ");
  const parts = cleanClause.split(/\s+AND\s+/i);
  let paramIdx = 0;

  for (const part of parts) {
    const expr = part.trim();
    let operator = "=";
    let colName = "";
    let valExpr = "";

    if (expr.includes("=")) {
      [colName, valExpr] = expr.split("=").map(x => x.trim().replace(/['"`]/g, ""));
      operator = "=";
    } else if (expr.includes(">")) {
      [colName, valExpr] = expr.split(">").map(x => x.trim().replace(/['"`]/g, ""));
      operator = ">";
    } else if (expr.includes("<")) {
      [colName, valExpr] = expr.split("<").map(x => x.trim().replace(/['"`]/g, ""));
      operator = "<";
    } else {
      continue;
    }

    colName = colName.toLowerCase();
    let compValue: any = undefined;

    if (valExpr === "?") {
      compValue = params[paramIdx++];
    } else {
      compValue = valExpr.replace(/^'|'$/g, "");
    }

    const rowValue = row[colName];

    if (operator === "=") {
      if (rowValue === undefined) return false;
      if (String(rowValue) !== String(compValue)) return false;
    } else if (operator === ">") {
      if (rowValue === undefined) return false;
      if (colName === "expires_at") {
        const rowTime = Number(rowValue);
        const compTime = compValue === "NOW()" || compValue.includes("now") ? Date.now() : Number(compValue);
        if (rowTime <= compTime) return false;
      } else {
        if (Number(rowValue) <= Number(compValue)) return false;
      }
    } else if (operator === "<") {
      if (rowValue === undefined) return false;
      if (colName === "expires_at") {
        const rowTime = Number(rowValue);
        const compTime = compValue === "NOW()" || compValue.includes("now") ? Date.now() : Number(compValue);
        if (rowTime >= compTime) return false;
      } else {
        if (Number(rowValue) >= Number(compValue)) return false;
      }
    }
  }

  return true;
}

function saveVirtualDb(tables: any) {
  try {
    const dbPath = process.env.VERCEL === "1" ? "/tmp/db.json" : path.join(process.cwd(), "db.json");
    fs.writeFileSync(dbPath, JSON.stringify(tables, null, 2), "utf8");
  } catch (err: any) {
    console.warn("VirtualDB SAVE failed:", err.message);
  }
}

function loadVirtualDb(): Record<string, any[]> {
  try {
    const dbPath = process.env.VERCEL === "1" ? "/tmp/db.json" : path.join(process.cwd(), "db.json");
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf8"));
    }
  } catch (err: any) {
    console.warn("VirtualDB LOAD failed:", err.message);
  }
  return {};
}

async function seedDefaultAdminsIfEmpty(db: any) {
  try {
    const usersList = await db.all("SELECT * FROM admin_users");
    if (!usersList || usersList.length === 0) {
      console.log("Seeding degli utenti amministratori di default in SQLite/VirtualDB...");
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
      console.log("Utenti amministratori di default inseriti con successo.");
    }
  } catch (err: any) {
    console.warn("Avviso durante seedDefaultAdminsIfEmpty:", err.message);
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
        await db.run(`CREATE TABLE IF NOT EXISTS citizen_profiles (
          email VARCHAR(150) PRIMARY KEY,
          nome VARCHAR(100),
          cognome VARCHAR(100),
          codice_fiscale VARCHAR(16),
          telefono VARCHAR(30),
          indirizzo VARCHAR(255),
          comune_residenza VARCHAR(100),
          sesso VARCHAR(10),
          comune_nascita VARCHAR(100),
          data_nascita VARCHAR(20),
          is_spid_verified TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
      } catch (cpErr: any) {
        console.warn("Avviso: Impossibile creare citizen_profiles in SQLite esistente:", cpErr.message);
      }
      try {
        await db.run("ALTER TABLE admin_users ADD COLUMN email VARCHAR(150) DEFAULT NULL");
      } catch (e: any) {}
      try {
        await db.run("ALTER TABLE admin_users ADD COLUMN visible_modules TEXT DEFAULT NULL");
      } catch (e: any) {}
      
      const sqliteRegCols = [
        "razza VARCHAR(100) DEFAULT NULL",
        "data_nascita VARCHAR(50) DEFAULT NULL",
        "segni_particolari TEXT DEFAULT NULL",
        "proprietario_nome VARCHAR(150) DEFAULT NULL",
        "proprietario_email VARCHAR(150) DEFAULT NULL",
        "proprietario_telefono VARCHAR(50) DEFAULT NULL",
        "proprietario_indirizzo VARCHAR(255) DEFAULT NULL",
        "proprietario_cf VARCHAR(20) DEFAULT NULL"
      ];
      for (const colDef of sqliteRegCols) {
        try {
          await db.run(`ALTER TABLE registro_anagrafica ADD COLUMN ${colDef}`);
        } catch (e: any) {}
      }

      try {
        await db.run("ALTER TABLE citizen_profiles ADD COLUMN sesso VARCHAR(10) DEFAULT NULL");
      } catch (e: any) {}
      try {
        await db.run("ALTER TABLE citizen_profiles ADD COLUMN comune_nascita VARCHAR(100) DEFAULT NULL");
      } catch (e: any) {}
      try {
        await db.run("ALTER TABLE citizen_profiles ADD COLUMN data_nascita VARCHAR(20) DEFAULT NULL");
      } catch (e: any) {}

      // Seeding assicurato se la tabella admin_users è vuota
      await seedDefaultAdminsIfEmpty(db);
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

      const sqliteRegCols = [
        "razza VARCHAR(100) DEFAULT NULL",
        "data_nascita VARCHAR(50) DEFAULT NULL",
        "segni_particolari TEXT DEFAULT NULL",
        "proprietario_nome VARCHAR(150) DEFAULT NULL",
        "proprietario_email VARCHAR(150) DEFAULT NULL",
        "proprietario_telefono VARCHAR(50) DEFAULT NULL",
        "proprietario_indirizzo VARCHAR(255) DEFAULT NULL",
        "proprietario_cf VARCHAR(20) DEFAULT NULL"
      ];
      for (const colDef of sqliteRegCols) {
        try {
          await db.run(`ALTER TABLE registro_anagrafica ADD COLUMN ${colDef}`);
        } catch (e: any) {}
      }

      // Seeding default admin users
      await seedDefaultAdminsIfEmpty(db);
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
      convertedSql = convertedSql.replace(/(\w+)\(\)\s*-\s*INTERVAL\s+(\d+)\s+(HOUR|DAY|MONTH|YEAR)S?/gi, (match, func, val, unit) => {
        const u = unit.toLowerCase();
        return `datetime('now', 'localtime', '-${val} ${u}s')`;
      });
      convertedSql = convertedSql.replace(/DATE_SUB\(([^,]+),\s*INTERVAL\s+(\d+)\s+(HOUR|DAY|MONTH|YEAR)S?\)/gi, (match, dateExpr, val, unit) => {
        const d = dateExpr.trim().toLowerCase() === "curdate()" || dateExpr.trim().toLowerCase() === "now()" ? "'now', 'localtime'" : dateExpr;
        const u = unit.toLowerCase();
        return `datetime(${d}, '-${val} ${u}s')`;
      });
      convertedSql = convertedSql.replace(/NOW\(\)/gi, "datetime('now', 'localtime')");
      convertedSql = convertedSql.replace(/CURDATE\(\)/gi, "date('now', 'localtime')");
      convertedSql = convertedSql.replace(/CONCAT\(([^,]+),\s*([^)]+)\)/gi, "$1 || $2");
      convertedSql = convertedSql.replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
      convertedSql = convertedSql.replace(/INTEGER AUTO_INCREMENT PRIMARY KEY/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
      convertedSql = convertedSql.replace(/YEAR\(([^)]+)\)/gi, "CAST(strftime('%Y', $1) AS INTEGER)");
      convertedSql = convertedSql.replace(/MONTH\(([^)]+)\)/gi, "CAST(strftime('%m', $1) AS INTEGER)");
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
