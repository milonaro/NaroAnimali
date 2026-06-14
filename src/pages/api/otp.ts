import { Router } from "express";
import mysqlPool, { getIsMysqlHealthy } from "../../../src/lib/mysql.js";
import jwt from "jsonwebtoken";
import { Resend } from "resend";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "animal-hub-secret-otp";

// Funzione helper per generare OTP a 6 cifre
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/request", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  if (!mysqlPool || !getIsMysqlHealthy()) {
    return res.status(500).json({ error: "DB Error" });
  }

  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 minuti di validita'

    // Inserisce o aggiorna l'OTP per questa email
    await mysqlPool.execute(
      "INSERT INTO user_otps (email, otp_code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp_code = ?, expires_at = ?",
      [email, otp, expiresAt, otp, expiresAt]
    );

    const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const ip = ipHeader.substring(0, 45);
    const userAgent = (req.headers['user-agent'] || '').substring(0, 255);
    await mysqlPool.execute(
      "INSERT INTO citizen_access_logs (email, ip_address, user_agent, azione) VALUES (?, ?, ?, ?)",
      [email, ip, userAgent, 'RICHIESTA_OTP']
    );

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "AnimalHub PA <onboarding@resend.dev>",
        to: email,
        subject: "Il tuo codice di accesso OTP - AnimalHub PA",
         html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #15803d;">Codice di Accesso Monouso</h2>
            <p>Usa il seguente codice per accedere al Fascicolo Elettronico (La Mia Area):</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #1e3a5f;">
              ${otp}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Il codice è valido per 15 minuti. Non condividerlo con nessuno.</p>
          </div>
        `
      });
      console.log(`[OTP] Email inviata a: ${email}`);
    } else {
      console.log(`[OTP] Email: ${email} - Codice: ${otp} (Simulato, nessuna KEY Resend)`);
    }

    res.json({ success: true, message: "OTP inviato con successo alla tua email" });
  } catch (err: any) {
    console.error("ERRORE Richiesta OTP:", err.message);
    res.status(500).json({ error: "Errore durante la generazione dell'OTP" });
  }
});

router.post("/verify", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

  if (!mysqlPool || !getIsMysqlHealthy()) {
    return res.status(500).json({ error: "DB Error" });
  }

  try {
    const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const ip = ipHeader.substring(0, 45);
    const userAgent = (req.headers['user-agent'] || '').substring(0, 255);

    const [rows]: any = await mysqlPool.execute(
      "SELECT * FROM user_otps WHERE email = ? AND otp_code = ?",
      [email, otp]
    );

    const record = rows[0];

    if (!record) {
      await mysqlPool.execute(
        "INSERT INTO citizen_access_logs (email, ip_address, user_agent, azione) VALUES (?, ?, ?, ?)",
        [email, ip, userAgent, 'VERIFICA_OTP_FALLITA_ERRATO']
      );
      return res.status(401).json({ error: "Codice OTP non valido o errato" });
    }

    if (new Date() > new Date(record.expires_at)) {
      await mysqlPool.execute(
        "INSERT INTO citizen_access_logs (email, ip_address, user_agent, azione) VALUES (?, ?, ?, ?)",
        [email, ip, userAgent, 'VERIFICA_OTP_FALLITA_SCADUTO']
      );
      return res.status(401).json({ error: "Codice OTP scaduto" });
    }

    // OTP Valido: Rimuovilo dal DB per sicurezza (One Time)
    await mysqlPool.execute("DELETE FROM user_otps WHERE email = ?", [email]);

    // Genera JWT
    const token = jwt.sign({ email, type: "citizen" }, JWT_SECRET, { expiresIn: '7d' });

    // Set cookie
    res.cookie("citizen_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });

    await mysqlPool.execute(
      "INSERT INTO citizen_access_logs (email, ip_address, user_agent, azione) VALUES (?, ?, ?, ?)",
      [email, ip, userAgent, 'VERIFICA_OTP_SUCCESSO']
    );

    res.json({ success: true, token });
  } catch (err: any) {
    console.error("ERRORE Verifica OTP:", err.message);
    res.status(500).json({ error: "Errore durante la verifica dell'OTP" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("citizen_token");
  res.json({ success: true });
});

router.get("/me", async (req, res) => {
  const token = req.cookies.citizen_token;
  if (!token) return res.status(401).json({ error: "Non autenticato" });
  
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: "Token non valido o scaduto" });
  }
});

export default router;
