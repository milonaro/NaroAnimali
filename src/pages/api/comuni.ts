import express from "express";
import mysqlPool, { getIsMysqlHealthy } from "../../lib/mysql.js";
import { requireAuth } from "../../lib/server-utils.js";

const router = express.Router();

router.get("/", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  try {
    const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const ip = ipHeader.substring(0, 45);
    const userAgent = (req.headers['user-agent'] || '').substring(0, 255);
    const pageVisited = (req.query.page as string) || 'Home / Elenco Comuni';
    const comuneSel = (req.query.comune as string) || '';
    const referrer = (req.headers['referrer'] as string) || (req.headers['referer'] as string) || '';
    const sessId = (req.cookies && req.cookies.visitor_session) || 'SESS_' + Math.random().toString(36).substring(2, 10);
    
    if (!req.cookies || !req.cookies.visitor_session) {
      res.cookie("visitor_session", sessId, { maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: true, secure: true, sameSite: 'none' }); 
    }

    await mysqlPool.execute(
      "INSERT INTO visitor_tracking_logs (session_id, ip_address, user_agent, page_visited, referrer, comune_selezionato) VALUES (?, ?, ?, ?, ?, ?)",
      [sessId, ip, userAgent, pageVisited, referrer, comuneSel]
    );

    const [rows] = await mysqlPool.execute("SELECT * FROM comuni");
    res.json(rows);
  } catch (err) {
    console.error("DB error in comuni:", err);
    try {
      const [rows] = await mysqlPool!.execute("SELECT * FROM comuni");
      res.json(rows);
    } catch (_) {
      res.json([]);
    }
  }
});

router.post("/track-visit", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json({ success: false });
  try {
    const { page, comuneSel } = req.body;
    const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const ip = ipHeader.substring(0, 45);
    const userAgent = (req.headers['user-agent'] || '').substring(0, 255);
    const referrer = (req.headers['referrer'] as string) || (req.headers['referer'] as string) || '';
    const sessId = (req.cookies && req.cookies.visitor_session) || 'SESS_' + Math.random().toString(36).substring(2, 10);
    
    if (!req.cookies || !req.cookies.visitor_session) {
      res.cookie("visitor_session", sessId, { maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: true, secure: true, sameSite: 'none' });
    }

    await mysqlPool.execute(
      "INSERT INTO visitor_tracking_logs (session_id, ip_address, user_agent, page_visited, referrer, comune_selezionato) VALUES (?, ?, ?, ?, ?, ?)",
      [sessId, ip, userAgent, page || 'Sconosciuta', referrer, comuneSel || '']
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Tracking error:", err);
    res.json({ success: false });
  }
});

router.get("/config", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json({});
  try {
    const [rows]: any = await mysqlPool.execute("SELECT * FROM admin_config");
    const config = rows.reduce((acc: any, row: any) => ({ ...acc, [row.key_name]: row.value_data }), {});
    res.json(config);
  } catch (err) {
    console.error("DB error in config:", err);
    res.json({});
  }
});

router.post("/config", requireAuth(["ADMIN"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await mysqlPool.execute("INSERT INTO admin_config (key_name, value_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_data = ?", [key, String(value), String(value)]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("DB error in config post:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

router.post("/demo-switch", requireAuth(["ADMIN"]), async (req, res) => {
  const { key } = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    await mysqlPool.execute("UPDATE admin_config SET value_data = ? WHERE key_name = 'activeComune'", [key]);
    res.json({ success: true });
  } catch (err) {
    console.error("DB error in demo switch:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

router.put("/:key", requireAuth(["ADMIN"]), async (req, res) => {
  const { key } = req.params;
  const { 
    name, lat, lng, radius_km, 
    threshold_centro_km, threshold_periferia_km, threshold_campagna_km 
  } = req.body;
  
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  
  try {
    await mysqlPool.execute(
      `UPDATE comuni SET 
        name = ?, lat = ?, lng = ?, radius_km = ?, 
        threshold_centro_km = ?, threshold_periferia_km = ?, threshold_campagna_km = ? 
      WHERE key_name = ?`,
      [
        name, lat, lng, radius_km, 
        threshold_centro_km, threshold_periferia_km, threshold_campagna_km, 
        key
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("DB error in comuni update:", err);
    res.status(500).json({ error: "Errore durante l'aggiornamento del comune." });
  }
});

export default router;
