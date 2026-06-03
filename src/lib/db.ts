import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';
import admin from 'firebase-admin';

// Assicuriamoci che l'ambiente sia caricato
dotenv.config();

let mysqlPool: mysql.Pool | null = null;
let sqliteDb: any = null;

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

export const dbAdmin = admin.apps.length ? admin.firestore() : null;

// MYSQL ARUBA / LOCAL FALLBACK
export async function getDatabase() {
  if (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER) {
    if (!mysqlPool) {
      try {
        mysqlPool = mysql.createPool({
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
    sqliteDb = await open({
      filename: path.join(process.cwd(), 'database.sqlite'),
      driver: sqlite3.Database
    });
    console.log("Uso Fallback SQLite locale per testing");
  }

  return { mysqlPool, sqliteDb };
}
