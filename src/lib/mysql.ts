import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let pool: mysql.Pool | null = null;
let isHealthy = false;

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
    isHealthy = true; // Set to true provisionally; can be verified later.
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
  return isHealthy && pool !== null;
}

export const getPool = () => {
  if (isHealthy) return pool;
  return null;
};

export default pool;

