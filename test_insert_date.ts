import sqlite3 from "sqlite3";
import { open as openSqlite } from "sqlite";
import path from "path";

async function main() {
  const dbPath = path.join(process.cwd(), "database.sqlite");
  const db = await openSqlite({
    filename: dbPath,
    driver: sqlite3.Database
  });

  const email = "test_date@example.com";
  const otp = "123456";
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Clean old
  await db.run("DELETE FROM user_otps WHERE email = ?", [email]);

  // Insert
  await db.run("INSERT INTO user_otps (email, otp_code, expires_at) VALUES (?, ?, ?)", [email, otp, expiresAt]);

  const rows = await db.all("SELECT * FROM user_otps WHERE email = ?", [email]);
  console.log("Stored expires_at type and value:", typeof rows[0].expires_at, rows[0].expires_at);
}

main();
