import express from "express";
import bcrypt from "bcryptjs";
import mysqlPool, { getIsMysqlHealthy } from "../../lib/mysql.js";
import { requireAuth, recordAuditLog } from "../../lib/server-utils.js";

const router = express.Router();

router.get("/", requireAuth(["ADMIN"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const [rows] = await mysqlPool.execute("SELECT id, username, role, comune_key, visible_modules, email FROM admin_users ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Errore nel caricamento degli operatori." });
  }
});

router.post("/", requireAuth(["ADMIN"]), async (req, res) => {
  const { username, password, role, comune_key, visible_modules, email } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password e ruolo sono obbligatori." });
  }
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const modulesStr = visible_modules ? JSON.stringify(visible_modules) : null;
    await mysqlPool.execute(
      "INSERT INTO admin_users (username, password_hash, role, comune_key, visible_modules, email) VALUES (?, ?, ?, ?, ?, ?)",
      [username, hash, role, comune_key || "naro", modulesStr, email || null]
    );
    await recordAuditLog(req, "CREAZIONE_UTENTE", "GESTIONE_UTENTI", `Creato operatore ${username} con ruolo ${role}`);
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Questo nome utente è già registrato." });
    }
    res.status(500).json({ error: "Errore durante la creazione dell'operatore." });
  }
});

router.put("/:id", requireAuth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const { username, password, role, comune_key, visible_modules, email } = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const modulesStr = visible_modules ? JSON.stringify(visible_modules) : null;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await mysqlPool.execute(
        "UPDATE admin_users SET username = ?, password_hash = ?, role = ?, comune_key = ?, visible_modules = ?, email = ? WHERE id = ?",
        [username, hash, role, comune_key || "naro", modulesStr, email || null, id]
      );
    } else {
      await mysqlPool.execute(
        "UPDATE admin_users SET username = ?, role = ?, comune_key = ?, visible_modules = ?, email = ? WHERE id = ?",
        [username, role, comune_key || "naro", modulesStr, email || null, id]
      );
    }
    await recordAuditLog(req, "MODIFICA_UTENTE", "GESTIONE_UTENTI", `Aggiornato operatore ID ${id} (${username})`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Errore durante l'aggiornamento dell'operatore." });
  }
});

router.delete("/:id", requireAuth(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const [userRows]: any = await mysqlPool.execute("SELECT username FROM admin_users WHERE id = ?", [id]);
    if (userRows && userRows[0]?.username === "admin") {
      return res.status(400).json({ error: "Non è possibile rimuovere l'amministratore principale di sistema." });
    }
    const targetUsername = userRows[0]?.username || id;
    await mysqlPool.execute("DELETE FROM admin_users WHERE id = ?", [id]);
    await recordAuditLog(req, "ELIMINAZIONE_UTENTE", "GESTIONE_UTENTI", `Eliminato operatore ${targetUsername}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore durante l'eliminazione dell'operatore." });
  }
});

export default router;
