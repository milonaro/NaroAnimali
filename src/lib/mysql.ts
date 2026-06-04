import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let pool: mysql.Pool | null = null;

if (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER) {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log("Connesso al database MySQL su Aruba");
  } catch (e) {
    console.error("Errore di connessione a MySQL:", e);
  }
}

export const getPool = () => pool;
export default pool;
