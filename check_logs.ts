import sqlite3 from "sqlite3";
import { open as openSqlite } from "sqlite";
import path from "path";

async function main() {
  const dbPath = path.join(process.cwd(), "database.sqlite");
  const db = await openSqlite({
    filename: dbPath,
    driver: sqlite3.Database
  });
  const logs = await db.all("SELECT * FROM admin_access_logs ORDER BY id DESC LIMIT 10");
  console.log("Recent admin_access_logs:", JSON.stringify(logs, null, 2));
}
main();
