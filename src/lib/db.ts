import mysqlPromise from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import admin from 'firebase-admin';
import { getFirestore as getFirestoreAdmin } from 'firebase-admin/firestore';
import fs from "fs";

// Assicuriamoci che l'ambiente sia caricato
dotenv.config();

let mysqlPool: mysqlPromise.Pool | null = null;
let sqliteDb: any = null;

// Leggiamo la configurazione client per estrarre la corretta istanza di database Firestore
let firestoreDatabaseId: string | undefined = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
if (!firestoreDatabaseId && process.env.VERCEL !== "1") {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      firestoreDatabaseId = config.firestoreDatabaseId;
    }
  } catch (e) {
    console.error("Error reading firebase-applet-config.json in db.ts:", e);
  }
}

// FIREBASE ADMIN
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}");
    if (serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin Inizializzato (MySQL Sync)");
    }
  } catch (e) {
    console.error("Firebase Admin Init Error in db.ts:", e);
  }
}

export const dbAdmin = admin.apps.length ? (firestoreDatabaseId ? getFirestoreAdmin(admin.app(), firestoreDatabaseId) : admin.firestore()) : null;

// MYSQL ARUBA / LOCAL FALLBACK
export async function getDatabase() {
  if (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER) {
    if (!mysqlPool) {
      try {
        mysqlPool = mysqlPromise.createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          database: process.env.DB_NAME,
          password: process.env.DB_PASS,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });
        console.log("Connesso al database remoto MySQL (Aruba)");
      } catch (e) {
        console.error("Errore connessione a MySQL Aruba, fallback gestito.", e);
      }
    }
  }

  // Fallback su SQLite se MySQL non configurato o offline
  if (!mysqlPool && !sqliteDb) {
    const sqlite3Module = await import('sqlite3');
    const sqliteModule = await import('sqlite');
    sqliteDb = await sqliteModule.open({
      filename: path.join(process.cwd(), 'database.sqlite'),
      driver: sqlite3Module.default.Database
    });
    console.log("Uso Fallback SQLite locale per testing");
  }

  return { mysqlPool, sqliteDb };
}
