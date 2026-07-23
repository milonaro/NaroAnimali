import mysqlPool, { getIsMysqlHealthy, setMysqlHealthy } from "./mysql.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createMySQLTables, addMySQLColumns, seedAdminUsers } from "./mysql_init.js";

export { mysqlPool, getIsMysqlHealthy, seedAdminUsers };

export let dbInitPromise: Promise<void> | null = null;

async function runDatabaseInitialization() {
  if (mysqlPool && getIsMysqlHealthy()) {
    try {
      await mysqlPool.query("SELECT 1");
    } catch (err) {
      console.warn("MySQL Ping Failed on boot. Disabling MySQL features to prevent timeout.");
      setMysqlHealthy(false);
    }
  }

  await createMySQLTables();
  await addMySQLColumns();
  await seedAdminUsers();
}

export function getDbInitPromise() {
  if (!dbInitPromise) {
    dbInitPromise = runDatabaseInitialization();
  }
  return dbInitPromise;
}

// Auto-initialize if not done
if (!dbInitPromise) {
  dbInitPromise = runDatabaseInitialization();
}

export async function getActiveComune(): Promise<string> {
  if (!mysqlPool || !getIsMysqlHealthy()) return 'default';
  try {
    const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
    return activeRow[0]?.value_data || 'default';
  } catch (e) {
    return 'default';
  }
}

export function requireAuth(allowedRoles?: string[]) {
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

export const parseExpiresAt = (val: any): Date => {
  if (val instanceof Date) return val;
  if (typeof val === "number") return new Date(val);
  if (typeof val === "string") {
    if (/^\d+$/.test(val)) return new Date(parseInt(val, 10));
    let cleanVal = val.trim();
    if (!cleanVal.endsWith("Z") && !cleanVal.includes("+") && !cleanVal.includes("GMT")) {
      if (cleanVal.includes(" ") && !cleanVal.includes("T")) {
        cleanVal = cleanVal.replace(" ", "T");
      }
      cleanVal += "Z";
    }
    return new Date(cleanVal);
  }
  return new Date(0);
};
