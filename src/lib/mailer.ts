import nodemailer from "nodemailer";

export async function sendOtpEmail(to: string, otp: string, isAdmin: boolean): Promise<boolean> {
  const title = isAdmin ? "Area Operatori & Admin" : "Fascicolo Elettronico (La Mia Area)";
  const subject = isAdmin ? "Codice Accesso Operatore/Admin - AnimalHub PA" : "Il tuo codice di accesso OTP - AnimalHub PA";
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center; color: #1e293b;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        <h2 style="color: #15803d; margin-bottom: 8px; font-size: 24px;">AnimalHub PA</h2>
        <div style="font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 24px;">${title}</div>
        
        <p style="font-size: 16px; line-height: 1.5; color: #334155;">Usa il seguente codice monouso (OTP) per completare la verifica di sicurezza ed accedere:</p>
        
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; color: #0f172a; margin: 24px 0;">
          ${otp}
        </div>
        
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
          Questo codice è strettamente riservato ed è valido per 10 minuti.<br>
          Se non hai richiesto tu questa e-mail, ignora tranquillamente questo messaggio.
        </p>
      </div>
    </div>
  `;

  // Read SMTP Configuration from Environmental Variables
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
  const smtpSecure = process.env.SMTP_SECURE !== "false"; // defaults to true for port 465, false for 587
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  const fromName = process.env.SMTP_FROM_NAME || "AnimalHub PA";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || "noreply@animalhubpa.it";

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false // Avoid issues due to self-signed or host certificates on corporate/hosted SMTPs
        }
      });

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html
      });
      console.log(`[SMTPMailer] Email OTP reale inviata con successo via SMTP (${smtpHost}) a: ${to}`);
      return true;
    } catch (err: any) {
      console.error(`[SMTPMailer Errore] Invio fallito via SMTP:`, err.message);
    }
  }

  // Fallback fallback: Check for Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resendInstance = new Resend(process.env.RESEND_API_KEY);
      
      // Resend has strict verification on sender domains when not on custom domains
      const verifiedFrom = fromEmail.includes("animalhubpa.it") || fromEmail.includes("tuodominio.it") 
        ? "onboarding@resend.dev" 
        : fromEmail;
        
      await resendInstance.emails.send({
        from: `AnimalHub PA <${verifiedFrom}>`,
        to,
        subject,
        html
      });
      console.log(`[ResendMailer] Email OTP reale inviata con successo via Resend a: ${to}`);
      return true;
    } catch (err: any) {
      console.error(`[ResendMailer Errore] Invio fallito via Resend:`, err.message);
    }
  }

  console.warn(`[Mailer Simulata] Nessun server SMTP o chiave Resend configurata. Email a ${to} simulata con OTP: ${otp}`);
  return false;
}
