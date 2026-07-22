import express from "express";
import mysqlPool, { getIsMysqlHealthy } from "../../lib/mysql.js";
import { requireAuth, getActiveComune } from "../../lib/server-utils.js";

const router = express.Router();

router.get("/logs", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  try {
    const activeComune = await getActiveComune();
    const [rows] = await mysqlPool.execute("SELECT * FROM adozioni_logs WHERE comune_key = ? ORDER BY data_adozione DESC", [activeComune]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Errore caricamento adozioni" });
  }
});

router.post("/", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const data = req.body;
    const activeComune = await getActiveComune();
    await mysqlPool.execute(
      "INSERT INTO adozioni_logs (comune_key, microchip, nome_animale, specie, sesso, data_adozione, adottante_nome, adottante_cf, adottante_telefono, adottante_email, adottante_indirizzo, note_adozione, stato_pratica) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        activeComune, data.microchip, data.nome_animale, data.specie, data.sesso,
        data.data_adozione || new Date(), data.adottante_nome, data.adottante_cf,
        data.adottante_telefono, data.adottante_email, data.adottante_indirizzo,
        data.note_adozione, data.stato_pratica || 'COMPLETATA'
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore salvataggio adozione" });
  }
});

router.put("/:id", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const { id } = req.params;
    const data = req.body;
    await mysqlPool.execute(
      "UPDATE adozioni_logs SET microchip=?, nome_animale=?, specie=?, sesso=?, data_adozione=?, adottante_nome=?, adottante_cf=?, adottante_telefono=?, adottante_email=?, adottante_indirizzo=?, note_adozione=?, stato_pratica=? WHERE id=?",
      [
        data.microchip, data.nome_animale, data.specie, data.sesso,
        data.data_adozione, data.adottante_nome, data.adottante_cf,
        data.adottante_telefono, data.adottante_email, data.adottante_indirizzo,
        data.note_adozione, data.stato_pratica, id
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore aggiornamento adozione" });
  }
});

router.put("/:id/stato", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const { id } = req.params;
    const { stato } = req.body;
    await mysqlPool.execute("UPDATE adozioni_logs SET stato_pratica = ? WHERE id = ?", [stato, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore aggiornamento stato" });
  }
});

router.delete("/:id", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  const { id } = req.params;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    await mysqlPool.execute("DELETE FROM adozioni_logs WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore eliminazione" });
  }
});

router.post("/:id/clona", requireAuth(["ADMIN", "CANILE_SANITARIO", "POLIZIA_LOCALE"]), async (req, res) => {
  const { id } = req.params;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const [rows]: any = await mysqlPool.execute("SELECT * FROM adozioni_logs WHERE id = ?", [id]);
    const original = rows[0];
    if (!original) return res.status(404).json({ error: "Adozione non trovata" });
    
    await mysqlPool.execute(
      "INSERT INTO adozioni_logs (comune_key, microchip, nome_animale, specie, sesso, data_adozione, adottante_nome, adottante_cf, adottante_telefono, adottante_email, adottante_indirizzo, note_adozione, stato_pratica) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        original.comune_key, original.microchip, original.nome_animale + " (COPIA)", original.specie, original.sesso,
        original.data_adozione, original.adottante_nome, original.adottante_cf,
        original.adottante_telefono, original.adottante_email, original.adottante_indirizzo,
        original.note_adozione, 'BOZZA'
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore clonazione" });
  }
});

export default router;
