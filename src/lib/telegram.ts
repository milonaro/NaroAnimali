import mysqlPool, { getIsMysqlHealthy } from "./mysql.js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Sends a raw text message to the configured Telegram bot.
 * Fails silently to prevent blocking any user action if the integration is misconfigured or offline.
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    // Silent skip if Telegram bot details are not configured yet
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Telegram API Error]:", errText);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Telegram Connection Error]:", error);
    return false;
  }
}

/**
 * Helper to get the current active Comune from the database.
 */
async function fetchActiveComuneName(): Promise<string> {
  if (!mysqlPool || !getIsMysqlHealthy()) return "Sconosciuto";
  try {
    const [rows]: any = await mysqlPool.execute("SELECT value_data FROM admin_config WHERE key_name = 'activeComune'");
    const code = rows[0]?.value_data || "naro";
    return code.toUpperCase();
  } catch {
    return "NARO";
  }
}

/**
 * Clean and shorten user agent for display.
 */
function cleanUserAgent(ua: string): string {
  if (!ua) return "Sconosciuto";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR")) return "Google Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Microsoft Edge";
  if (ua.includes("Postman")) return "Postman";
  return ua.split(" ")[0] || ua;
}

/**
 * Format timestamps with Italian localization or clear ISO.
 */
function getTimestampString(): string {
  return new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" }) + " (Ora Italiana)";
}

/**
 * Notify general portal view/access
 */
export async function notifyGeneralAccess(ip: string, userAgent: string): Promise<boolean> {
  const activeComune = await fetchActiveComuneName();
  const cleanedUA = cleanUserAgent(userAgent);
  const timestamp = getTimestampString();

  const msg = `
🌐 <b>[AnimalHub PA] - NUOVO ACCESSO PORTALE</b>
─────────────────────────────
🏛️ <b>Comune Attivo:</b> <code>${activeComune}</code>
📍 <b>Indirizzo IP:</b> <code>${ip}</code>
💻 <b>Dispositivo:</b> <code>${cleanedUA}</code>
⏰ <b>Timestamp:</b> <code>${timestamp}</code>
─────────────────────────────
<i>Monitoraggio Traffico Attivo • AnimalHub Cloud</i>
`.trim();

  return sendTelegramMessage(msg);
}

/**
 * Notify citizen OTP request
 */
export async function notifyCitizenOtpRequest(email: string, ip: string, userAgent: string): Promise<boolean> {
  const activeComune = await fetchActiveComuneName();
  const cleanedUA = cleanUserAgent(userAgent);
  const timestamp = getTimestampString();

  const msg = `
🔑 <b>[AnimalHub PA] - RICHIESTA ACCESSO CITTADINO</b>
─────────────────────────────
🏛️ <b>Comune:</b> <code>${activeComune}</code>
📧 <b>Email Cittadino:</b> <code>${email}</code>
📍 <b>Indirizzo IP:</b> <code>${ip}</code>
💻 <b>Dispositivo:</b> <code>${cleanedUA}</code>
⏰ <b>Timestamp:</b> <code>${timestamp}</code>
⚙️ <b>Stato:</b> <code>Codice OTP Generato & Inviato</code>
─────────────────────────────
`.trim();

  return sendTelegramMessage(msg);
}

/**
 * Notify citizen OTP verification success or failure
 */
export async function notifyCitizenOtpVerify(
  email: string,
  isSuccess: boolean,
  ip: string,
  userAgent: string,
  reason?: string
): Promise<boolean> {
  const activeComune = await fetchActiveComuneName();
  const cleanedUA = cleanUserAgent(userAgent);
  const timestamp = getTimestampString();

  const statusEmoji = isSuccess ? "✅" : "❌";
  const statusText = isSuccess ? "AUTENTICATO CON SUCCESSO" : "TENTATIVO DI LOGIN FALLITO";

  const msg = `
${statusEmoji} <b>[AnimalHub PA] - LOGIN CITTADINO</b>
─────────────────────────────
🏛️ <b>Comune:</b> <code>${activeComune}</code>
📧 <b>Email Cittadino:</b> <code>${email}</code>
📌 <b>Esito:</b> <b>${statusText}</b>
${reason ? `⚠️ <b>Dettaglio:</b> <code>${reason}</code>\n` : ""}📍 <b>Indirizzo IP:</b> <code>${ip}</code>
💻 <b>Dispositivo:</b> <code>${cleanedUA}</code>
⏰ <b>Timestamp:</b> <code>${timestamp}</code>
─────────────────────────────
`.trim();

  return sendTelegramMessage(msg);
}

/**
 * Notify admin credentials login (password verification step)
 */
export async function notifyAdminLoginAttempt(
  username: string,
  isSuccess: boolean,
  ip: string,
  userAgent: string,
  note?: string
): Promise<boolean> {
  const activeComune = await fetchActiveComuneName();
  const cleanedUA = cleanUserAgent(userAgent);
  const timestamp = getTimestampString();

  const statusEmoji = isSuccess ? "🛡️" : "⚠️";
  const statusText = isSuccess ? "CREDENTIALS OK - RICHIESTO OTP" : "TENTATIVO ACCESSO FALLITO (CREDENTIALS KO)";

  const msg = `
${statusEmoji} <b>[AnimalHub PA] - ACCESSO OPERATORE (STEP 1)</b>
─────────────────────────────
🏛️ <b>Comune:</b> <code>${activeComune}</code>
👤 <b>Username:</b> <code>${username}</code>
📌 <b>Esito:</b> <b>${statusText}</b>
📝 <b>Note:</b> <code>${note || "Nessuna nota aggiuntiva"}</code>
📍 <b>Indirizzo IP:</b> <code>${ip}</code>
💻 <b>Dispositivo:</b> <code>${cleanedUA}</code>
⏰ <b>Timestamp:</b> <code>${timestamp}</code>
─────────────────────────────
`.trim();

  return sendTelegramMessage(msg);
}

/**
 * Notify admin OTP verification success or failure
 */
export async function notifyAdminOtpVerify(
  username: string,
  isSuccess: boolean,
  ip: string,
  userAgent: string,
  note?: string
): Promise<boolean> {
  const activeComune = await fetchActiveComuneName();
  const cleanedUA = cleanUserAgent(userAgent);
  const timestamp = getTimestampString();

  const statusEmoji = isSuccess ? "🟢" : "🔴";
  const statusText = isSuccess ? "SESSIONE OPERATORE ATTIVATA" : "ERRORE VERIFICA OTP OPERATORE";

  const msg = `
${statusEmoji} <b>[AnimalHub PA] - VERIFICA ACCESSO OPERATORE (STEP 2)</b>
─────────────────────────────
🏛️ <b>Comune:</b> <code>${activeComune}</code>
👤 <b>Username:</b> <code>${username}</code>
📌 <b>Stato:</b> <b>${statusText}</b>
📝 <b>Note:</b> <code>${note || "Nessuna nota aggiuntiva"}</code>
📍 <b>Indirizzo IP:</b> <code>${ip}</code>
💻 <b>Dispositivo:</b> <code>${cleanedUA}</code>
⏰ <b>Timestamp:</b> <code>${timestamp}</code>
─────────────────────────────
`.trim();

  return sendTelegramMessage(msg);
}
