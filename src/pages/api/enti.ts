import express from "express";
import mysqlPool, { getIsMysqlHealthy } from "../../lib/mysql.js";
import { requireAuth, getActiveComune } from "../../lib/server-utils.js";

const router = express.Router();

// --- STRUTTURE CONVENZIONATE ---
router.get("/strutture", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  try {
    const activeComune = await getActiveComune();
    const [rows] = await mysqlPool.execute("SELECT * FROM strutture_convenzionate WHERE comune_key = ?", [activeComune]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Errore caricamento strutture" });
  }
});

router.post("/strutture", requireAuth(["ADMIN"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const data = req.body;
    const activeComune = await getActiveComune();
    await mysqlPool.execute(
      "INSERT INTO strutture_convenzionate (comune_key, nome, tipologia, indirizzo, contatti, p_iva, capacita_max, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [activeComune, data.nome, data.tipologia, data.indirizzo, data.contatti, data.p_iva, data.capacita_max || 0, data.note]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore salvataggio struttura" });
  }
});

// --- FATTURAZIONE E COSTI ---
router.get("/fatture", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  try {
    const activeComune = await getActiveComune();
    const [rows] = await mysqlPool.execute("SELECT * FROM fatture_servizi WHERE comune_key = ? ORDER BY data_emissione DESC", [activeComune]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Errore caricamento fatture" });
  }
});

router.post("/fatture", requireAuth(["ADMIN"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const data = req.body;
    const activeComune = await getActiveComune();
    await mysqlPool.execute(
      "INSERT INTO fatture_servizi (comune_key, numero_fattura, fornitore_nome, data_emissione, importo_lordo, stato_pagamento, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [activeComune, data.numero_fattura, data.fornitore_nome, data.data_emissione, data.importo_lordo, data.stato_pagamento || 'DA_PAGARE', data.note]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore salvataggio fattura" });
  }
});

// --- CONVENZIONI ATTIVE ---
router.get("/convenzioni", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  try {
    const activeComune = await getActiveComune();
    const [rows] = await mysqlPool.execute("SELECT * FROM convenzioni_attive WHERE comune_key = ? ORDER BY data_scadenza ASC", [activeComune]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Errore caricamento convenzioni" });
  }
});

router.post("/convenzioni", requireAuth(["ADMIN"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const data = req.body;
    const activeComune = await getActiveComune();
    await mysqlPool.execute(
      "INSERT INTO convenzioni_attive (comune_key, titolo, ente_partner, data_inizio, data_scadenza, budget_allocato, stato) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [activeComune, data.titolo, data.ente_partner, data.data_inizio, data.data_scadenza, data.budget_allocato || 0, data.stato || 'ATTIVA']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore salvataggio convenzione" });
  }
});

export default router;
