import express from "express";
import mysqlPool, { getIsMysqlHealthy } from "../../lib/mysql.js";
import { requireAuth } from "../../lib/server-utils.js";
import jwt from "jsonwebtoken";

const router = express.Router();

function getCitizenEmail(req: any): string | null {
  const token = req.cookies?.citizen_token || req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "animal-hub-secret-otp");
    return decoded.email || null;
  } catch (err) {
    return null;
  }
}

router.get("/my-animals", async (req, res) => {
  const email = getCitizenEmail(req);
  if (!email) return res.status(401).json({ error: "Accesso non autorizzato. Autenticazione richiesta via OTP." });
  
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  try {
    const [rows]: any = await mysqlPool.execute("SELECT * FROM registro_anagrafica WHERE proprietario_email = ? ORDER BY id DESC", [email]);
    
    const animalsWithLogs = [];
    for (const anim of rows) {
      const code = `ISCR-${anim.microchip.substring(0, 6)}`;
      const [logRows]: any = await mysqlPool.execute(
        "SELECT note FROM interventi_logs WHERE (segnalazione_codice = ? OR note LIKE ?) ORDER BY id DESC LIMIT 1",
        [code, `%microchip: ${anim.microchip}%`]
      );
      animalsWithLogs.push({
        ...anim,
        last_log_note: logRows && logRows[0] ? logRows[0].note : null
      });
    }
    
    res.json(animalsWithLogs);
  } catch (err: any) {
    console.error("Errore recupero animali cittadino con logs:", err.message);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

router.post("/my-animals", async (req, res) => {
  const email = getCitizenEmail(req);
  if (!email) return res.status(401).json({ error: "Accesso non autorizzato. Autenticazione richiesta via OTP." });
  
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  
  const data = req.body;
  if (!data.microchip || !data.nome || !data.specie) {
    return res.status(400).json({ error: "Microchip, nome e specie sono campi obbligatori." });
  }
  
  try {
    const [activeRow]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
    const comune = activeRow[0]?.value_data || 'naro';
    
    const [existing]: any = await mysqlPool.execute("SELECT * FROM registro_anagrafica WHERE microchip = ?", [data.microchip]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: "Questo microchip risulta già registrato nel sistema." });
    }
    
    await mysqlPool.execute(
      "INSERT INTO registro_anagrafica (microchip, nome, specie, razza, sesso, taglia, colore, data_nascita, segni_particolari, proprietario_nome, proprietario_email, proprietario_telefono, proprietario_indirizzo, proprietario_cf, comune_key, stato) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        data.microchip, data.nome, data.specie, data.razza || '', data.sesso || 'M',
        data.taglia || 'Media', data.colore || '', data.data_nascita || null,
        data.segni_particolari || '', data.proprietario_nome, email,
        data.proprietario_telefono, data.proprietario_indirizzo, data.proprietario_cf,
        comune, 'BOZZA'
      ]
    );
    
    await mysqlPool.execute(
      "INSERT INTO interventi_logs (comune_key, segnalazione_codice, operatore, azione, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      [comune, `ISCR-${data.microchip.substring(0, 6)}`, 'Cittadino', 'RICHIESTA_ISCRIZIONE', `Richiesta iscrizione anagrafica per ${data.nome} (${data.specie})`, new Date()]
    );
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("Errore inserimento animale:", err.message);
    res.status(500).json({ error: "Errore durante il salvataggio" });
  }
});

router.get("/", requireAuth(["ADMIN", "POLIZIA_LOCALE", "CANILE_SANITARIO", "VOLONTARIO"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  try {
    const [rows] = await mysqlPool.execute("SELECT * FROM registro_anagrafica ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Errore database" });
  }
});

router.post("/", requireAuth(["ADMIN", "POLIZIA_LOCALE", "CANILE_SANITARIO"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const data = req.body;
    await mysqlPool.execute(
      "INSERT INTO registro_anagrafica (microchip, nome, specie, razza, sesso, taglia, colore, data_nascita, segni_particolari, proprietario_nome, proprietario_email, proprietario_telefono, proprietario_indirizzo, proprietario_cf, comune_key, stato) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        data.microchip, data.nome, data.specie, data.razza, data.sesso,
        data.taglia, data.colore, data.data_nascita, data.segni_particolari,
        data.proprietario_nome, data.proprietario_email, data.proprietario_telefono,
        data.proprietario_indirizzo, data.proprietario_cf, data.comune_key || 'naro', data.stato || 'ATTIVO'
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore salvataggio" });
  }
});

router.put("/:id", requireAuth(["ADMIN", "POLIZIA_LOCALE", "CANILE_SANITARIO"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const { id } = req.params;
    const data = req.body;
    await mysqlPool.execute(
      "UPDATE registro_anagrafica SET microchip=?, nome=?, specie=?, razza=?, sesso=?, taglia=?, colore=?, data_nascita=?, segni_particolari=?, proprietario_nome=?, proprietario_email=?, proprietario_telefono=?, proprietario_indirizzo=?, proprietario_cf=?, stato=? WHERE id=?",
      [
        data.microchip, data.nome, data.specie, data.razza, data.sesso,
        data.taglia, data.colore, data.data_nascita, data.segni_particolari,
        data.proprietario_nome, data.proprietario_email, data.proprietario_telefono,
        data.proprietario_indirizzo, data.proprietario_cf, data.stato, id
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore aggiornamento" });
  }
});

router.get("/richieste", requireAuth(["ADMIN", "POLIZIA_LOCALE", "CANILE_SANITARIO", "VOLONTARIO"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  try {
    const [rows] = await mysqlPool.execute("SELECT * FROM registro_anagrafica WHERE stato = 'BOZZA' ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Errore recupero richieste" });
  }
});

router.put("/richieste/:id/stato", requireAuth(["ADMIN", "POLIZIA_LOCALE", "CANILE_SANITARIO"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const { id } = req.params;
    const { stato, note, operatore } = req.body;
    
    const [animRows]: any = await mysqlPool.execute("SELECT nome, microchip, comune_key FROM registro_anagrafica WHERE id = ?", [id]);
    const anim = animRows[0];
    
    await mysqlPool.execute("UPDATE registro_anagrafica SET stato = ? WHERE id = ?", [stato, id]);
    
    await mysqlPool.execute(
      "INSERT INTO interventi_logs (comune_key, segnalazione_codice, operatore, azione, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      [anim.comune_key, `ISCR-${anim.microchip.substring(0, 6)}`, operatore || 'Admin', `CAMBIO_STATO_${stato}`, note || `Stato aggiornato a ${stato}`, new Date()]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore aggiornamento stato" });
  }
});

export default router;
