import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mysqlPool, { getIsMysqlHealthy } from "../../lib/mysql.js";
import { requireAuth, parseExpiresAt, getActiveComune } from "../../lib/server-utils.js";
import { sendOtpEmail } from "../../lib/mailer.js";
import { notifyAdminLoginAttempt, notifyAdminOtpVerify } from "../../lib/telegram.js";

const router = express.Router();

router.get("/me", async (req, res) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: "Non autenticato" });
  try {
    const decoded = jwt.verify(token, "animal-hub-secret") as any;
    if (mysqlPool && getIsMysqlHealthy()) {
      try {
        const [rows]: any = await mysqlPool.execute("SELECT id, username, role, comune_key, visible_modules FROM admin_users WHERE username = ?", [decoded.username]);
        const user = rows[0];
        if (user) {
          let parsedModules = null;
          if (user.visible_modules) {
            try {
              parsedModules = JSON.parse(user.visible_modules);
            } catch(e) {}
          }
          return res.json({ 
            user: { 
              id: user.id, 
              username: user.username, 
              role: user.role, 
              comune_key: user.comune_key,
              visible_modules: parsedModules
            } 
          });
        }
      } catch (dbErr) {
        console.error("DB error in /api/admin/me", dbErr);
      }
    }
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: "Token non valido" });
  }
});

router.get("/config", async (req, res) => {
  try {
    const configData: Record<string, string> = {
      siteName: "AnimalHub PA",
      siteLogo: "",
      activeComune: "naro",
      comune_indirizzo: "Piazza Giuseppe Garibaldi, 1",
      comune_cap: "92028",
      comune_provincia: "AG",
      comune_email: "protocollo@comune.naro.ag.it",
      comune_telefono: "0922 941111",
      comune_pec: "protocollo@pec.comune.naro.ag.it",
      animalhub_logo: "",
      privacy_text: "",
      cookie_text: "",
      footer_text: "Servizio Benessere Animale e Sanità Pubblica",
      emergency_veterinario: "0922 941122",
      emergency_polizia: "0922 941111",
      emergency_volontari: "0922 956100",
      home_sliders: ""
    };

    if (mysqlPool && getIsMysqlHealthy()) {
      try {
        const [rows]: any = await mysqlPool.execute("SELECT key_name, value_data FROM admin_config");
        if (Array.isArray(rows)) {
          for (const row of rows) {
            if (row.key_name) {
              configData[row.key_name] = row.value_data || "";
            }
          }
        }
      } catch (err) {
        console.warn("Avviso lettura admin_config da DB:", err);
      }
    }
    res.json(configData);
  } catch (e: any) {
    res.status(500).json({ error: "Errore nel caricamento della configurazione" });
  }
});

router.post("/config", async (req, res) => {
  const payload = req.body || {};
  try {
    if (mysqlPool && getIsMysqlHealthy()) {
      const entries = Object.entries(payload);
      for (const [key, val] of entries) {
        if (typeof key === "string") {
          const strVal = typeof val === "object" ? JSON.stringify(val) : String(val ?? "");
          await mysqlPool.execute(
            "INSERT INTO admin_config (key_name, value_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_data = VALUES(value_data)",
            [key, strVal]
          );
        }
      }
    }
    res.json({ success: true, message: "Impostazioni salvate con successo" });
  } catch (err: any) {
    console.error("Errore salvataggio config:", err);
    res.status(500).json({ error: "Errore durante il salvataggio della configurazione" });
  }
});

const memoryOtps = new Map<string, { otpCode: string; email: string; username?: string; expiresAt: number }>();

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Inserisci la matricola / nome utente e la password." });
  }

  try {
    let user: any = null;
    if (mysqlPool && getIsMysqlHealthy()) {
      try {
        const [rows]: any = await mysqlPool.execute("SELECT * FROM admin_users WHERE username = ?", [username]);
        if (Array.isArray(rows) && rows.length > 0) {
          user = rows[0];
        }
      } catch (dbErr: any) {
        console.warn("Avviso ricerca utente admin in DB:", dbErr.message);
      }
    }

    // Auto-healing delle credenziali ufficiali di test se mancanti o errate nel DB
    const defaultCredentials: Record<string, { pass: string; role: string; email: string; modules: string }> = {
      admin: { pass: "admin2026", role: "ADMIN", email: "franco.tese@gmail.com", modules: JSON.stringify(['statistiche', 'modulo-b', 'modulo-c', 'modulo-adozioni']) },
      polizia: { pass: "polizia2026", role: "POLIZIA_LOCALE", email: "polizia@animalhubpa.it", modules: JSON.stringify(['modulo-b', 'modulo-c']) },
      canile: { pass: "canile2026", role: "CANILE_SANITARIO", email: "canile@animalhubpa.it", modules: JSON.stringify(['modulo-b', 'modulo-c', 'modulo-adozioni']) },
      volontario: { pass: "volontario2026", role: "VOLONTARIO", email: "volontari@animalhubpa.it", modules: JSON.stringify(['modulo-b']) }
    };

    let isMatch = false;

    if (defaultCredentials[username] && password === defaultCredentials[username].pass) {
      isMatch = true;
      const cred = defaultCredentials[username];
      const isPassCorrect = user && user.password_hash ? await bcrypt.compare(password, user.password_hash).catch(() => false) : false;
      if (!user || !isPassCorrect) {
        if (mysqlPool && getIsMysqlHealthy()) {
          try {
            const hash = await bcrypt.hash(password, 10);
            if (!user) {
              await mysqlPool.execute(
                "INSERT INTO admin_users (username, password_hash, role, comune_key, visible_modules, email) VALUES (?, ?, ?, ?, ?, ?)",
                [username, hash, cred.role, "naro", cred.modules, cred.email]
              );
            } else {
              await mysqlPool.execute(
                "UPDATE admin_users SET password_hash = ?, role = ?, visible_modules = ?, email = ? WHERE username = ?",
                [hash, cred.role, cred.modules, cred.email, username]
              );
            }
            const [updatedRows]: any = await mysqlPool.execute("SELECT * FROM admin_users WHERE username = ?", [username]);
            if (Array.isArray(updatedRows) && updatedRows.length > 0) {
              user = updatedRows[0];
            }
          } catch (e: any) {
            console.warn("Auto-heal admin user warning:", e.message);
          }
        }
        if (!user) {
          const hash = await bcrypt.hash(password, 10);
          user = { id: 1, username, password_hash: hash, role: cred.role, comune_key: "naro", visible_modules: cred.modules, email: cred.email };
        }
      }
    } else if (user && user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash).catch(() => false);
    }

    const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const ip = String(ipHeader).substring(0, 45);
    const userAgent = String(req.headers['user-agent'] || '').substring(0, 255);

    if (isMatch) {
      const targetEmail = user?.email || `${username}@animalhub.it`;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const expiresAtStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19);

      // Salva in memoria locale
      const memRecord = { otpCode: otp, email: targetEmail, username, expiresAt: Date.now() + 10 * 60 * 1000 };
      memoryOtps.set(targetEmail.toLowerCase().trim(), memRecord);
      if (username) memoryOtps.set(username.toLowerCase().trim(), memRecord);
      memoryOtps.set(otp, memRecord);

      // Salva in DB se disponibile
      if (mysqlPool && getIsMysqlHealthy()) {
        try {
          await mysqlPool.execute(
            "INSERT INTO user_otps (email, otp_code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp_code = ?, expires_at = ?",
            [targetEmail, otp, expiresAtStr, otp, expiresAtStr]
          );
        } catch (otpDbErr: any) {
          console.warn("Avviso salvataggio OTP in DB:", otpDbErr.message);
        }
      }

      let emailSent = false;
      try {
        emailSent = await sendOtpEmail(targetEmail, otp, true);
      } catch (mailErr: any) {
        console.error(`[ADMIN OTP ERROR] Errore nell'invio della mail a ${targetEmail}:`, mailErr.message);
      }

      if (mysqlPool && getIsMysqlHealthy()) {
        try {
          await mysqlPool.execute(
            "INSERT INTO admin_logs (username, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
            [username, "LOGIN_REQUEST", "Richiesto OTP per login", ip, userAgent]
          );
        } catch (logErr: any) {
          console.warn("Avviso salvataggio admin_logs:", logErr.message);
        }
      }

      return res.json({ 
        success: true, 
        requireOtp: true, 
        requiresOtp: true, 
        email: targetEmail,
        debugOtp: !emailSent ? otp : undefined
      });
    }

    notifyAdminLoginAttempt(username, false, ip, userAgent).catch(() => {});
    return res.status(401).json({ error: "Credenziali non valide" });
  } catch (e: any) {
    console.error("Errore critico in /api/admin/login:", e);
    return res.status(500).json({ error: "Errore durante l'autenticazione: " + (e.message || "Errore sconosciuto") });
  }
});

const handleOtpVerification = async (req: express.Request, res: express.Response) => {
  const { email, username, otp } = req.body || {};
  
  if (!otp) return res.status(400).json({ error: "Codice OTP obbligatorio" });

  try {
    let otpRecord: any = null;
    let user: any = null;

    // 1. Cerca in memoria
    const cleanOtp = String(otp).trim();
    const cleanEmail = email ? String(email).toLowerCase().trim() : "";
    const cleanUsername = username ? String(username).toLowerCase().trim() : "";

    const memRec = memoryOtps.get(cleanOtp) || memoryOtps.get(cleanEmail) || memoryOtps.get(cleanUsername);
    if (memRec && memRec.otpCode === cleanOtp && memRec.expiresAt > Date.now()) {
      otpRecord = { expires_at: new Date(memRec.expiresAt) };
    }

    // 2. Cerca in DB se presente
    if (!otpRecord && mysqlPool && getIsMysqlHealthy()) {
      const targetEmail = email || (username ? `${username}@animalhub.it` : undefined);

      if (targetEmail) {
        try {
          const [otpRows]: any = await mysqlPool.execute("SELECT * FROM user_otps WHERE email = ? AND otp_code = ?", [targetEmail, cleanOtp]);
          if (Array.isArray(otpRows) && otpRows.length > 0) {
            otpRecord = otpRows[0];
          }
        } catch (e: any) {}
      }

      if (!otpRecord) {
        try {
          const [otpRows]: any = await mysqlPool.execute("SELECT * FROM user_otps WHERE otp_code = ?", [cleanOtp]);
          if (Array.isArray(otpRows) && otpRows.length > 0) {
            otpRecord = otpRows[0];
          }
        } catch (e: any) {}
      }
    }

    // 3. Risoluzione Utente
    if (username && mysqlPool && getIsMysqlHealthy()) {
      try {
        const [userRows]: any = await mysqlPool.execute("SELECT * FROM admin_users WHERE username = ?", [username]);
        if (Array.isArray(userRows) && userRows.length > 0) user = userRows[0];
      } catch (e: any) {}
    }
    if (!user && email && mysqlPool && getIsMysqlHealthy()) {
      try {
        const [userRows]: any = await mysqlPool.execute("SELECT * FROM admin_users WHERE email = ?", [email]);
        if (Array.isArray(userRows) && userRows.length > 0) user = userRows[0];
      } catch (e: any) {}
    }

    const defaultCredentials: Record<string, { pass: string; role: string; email: string; modules: string }> = {
      admin: { pass: "admin2026", role: "ADMIN", email: "franco.tese@gmail.com", modules: JSON.stringify(['statistiche', 'modulo-b', 'modulo-c', 'modulo-adozioni']) },
      polizia: { pass: "polizia2026", role: "POLIZIA_LOCALE", email: "polizia@animalhubpa.it", modules: JSON.stringify(['modulo-b', 'modulo-c']) },
      canile: { pass: "canile2026", role: "CANILE_SANITARIO", email: "canile@animalhubpa.it", modules: JSON.stringify(['modulo-b', 'modulo-c', 'modulo-adozioni']) },
      volontario: { pass: "volontario2026", role: "VOLONTARIO", email: "volontari@animalhubpa.it", modules: JSON.stringify(['modulo-b']) }
    };

    if (!user && username && defaultCredentials[username]) {
      const cred = defaultCredentials[username];
      user = { id: 1, username, role: cred.role, comune_key: "naro", visible_modules: cred.modules, email: cred.email };
    }
    if (!user && email) {
      const foundEntry = Object.entries(defaultCredentials).find(([_, c]) => c.email.toLowerCase() === String(email).toLowerCase());
      if (foundEntry) {
        const [uName, cred] = foundEntry;
        user = { id: 1, username: uName, role: cred.role, comune_key: "naro", visible_modules: cred.modules, email: cred.email };
      }
    }

    if (!otpRecord) {
      return res.status(401).json({ error: "Codice OTP/Token non trovato o errato" });
    }

    if (parseExpiresAt(otpRecord.expires_at) < new Date()) {
      return res.status(401).json({ error: "Codice OTP scaduto. Richiedi un nuovo token." });
    }

    if (!user) {
      user = { id: 1, username: username || "admin", role: "ADMIN", comune_key: "naro" };
    }

    const token = jwt.sign(
      { id: user.id || 1, username: user.username, role: user.role, comune_key: user.comune_key || "naro" },
      "animal-hub-secret",
      { expiresIn: "8h" }
    );
    res.cookie("admin_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 });

    const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const ip = String(ipHeader).substring(0, 45);
    const userAgent = String(req.headers['user-agent'] || '').substring(0, 255);

    if (mysqlPool && getIsMysqlHealthy()) {
      try {
        await mysqlPool.execute(
          "INSERT INTO admin_logs (username, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
          [user.username, "OTP_VERIFIED", "OTP verificato con successo", ip, userAgent]
        );
      } catch (e: any) {}

      try {
        const targetEmail = email || user?.email;
        if (targetEmail) {
          await mysqlPool.execute("DELETE FROM user_otps WHERE email = ?", [targetEmail]);
        }
      } catch (e: any) {}
    }

    // Pulizia memoria
    memoryOtps.delete(cleanOtp);
    if (cleanEmail) memoryOtps.delete(cleanEmail);
    if (cleanUsername) memoryOtps.delete(cleanUsername);

    notifyAdminOtpVerify(user.username, true, ip, userAgent).catch(() => {});

    return res.json({ success: true, user: { username: user.username, role: user.role } });
  } catch (e: any) {
    console.error("Errore verifica OTP:", e);
    return res.status(500).json({ error: "Errore durante la verifica del token OTP: " + (e.message || "Errore sconosciuto") });
  }
};

router.post("/verify-otp", handleOtpVerification);
router.post("/login/verify-otp", handleOtpVerification);

router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: "Campi obbligatori mancanti" });
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });

  try {
    const [otpRows]: any = await mysqlPool.execute("SELECT * FROM user_otps WHERE email = ? AND otp_code = ?", [email, otp]);
    const otpRecord = otpRows[0];

    if (!otpRecord || parseExpiresAt(otpRecord.expires_at) < new Date()) {
      return res.status(401).json({ error: "Codice OTP non valido o scaduto" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await mysqlPool.execute("UPDATE admin_users SET password_hash = ? WHERE email = ?", [hash, email]);
    await mysqlPool.execute("DELETE FROM user_otps WHERE email = ?", [email]);

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Errore durante il reset" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("admin_token");
  res.json({ success: true });
});

router.get("/segnalazioni/pii", requireAuth(["ADMIN", "OPERATORE"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const activeComune = await getActiveComune();
    const [rows]: any = await mysqlPool.execute(
      "SELECT codice_tracking, nome_segnalante, email_segnalante, telefono_segnalante FROM segnalazioni WHERE comune_key = ?",
      [activeComune]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching PII:", error);
    res.status(500).json({ error: "Errore durante il recupero dei dati riservati" });
  }
});

router.get("/setup-status", async (req, res) => {
  const isConfigured = !!(process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  res.json({
    success: true,
    configured: isConfigured,
    isVercel: !!process.env.VERCEL,
    dbHost: process.env.DB_HOST || "",
    dbName: process.env.DB_NAME || "",
    dbUser: process.env.DB_USER || "",
    dbPort: process.env.DB_PORT || "3306"
  });
});

router.post("/test-mysql", async (req, res) => {
  const { dbHost, dbUser, dbPass, dbName, dbPort } = req.body;
  if (!dbHost || !dbUser || !dbName) {
    return res.status(400).json({ success: false, message: "Host, Utente e Nome Database sono obbligatori." });
  }

  try {
    const mysql = await import("mysql2/promise");
    const connection = await mysql.default.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPass || "",
      database: dbName,
      port: dbPort ? parseInt(dbPort, 10) : 3306,
      connectTimeout: 5000
    });

    await connection.ping();
    await connection.end();

    res.json({
      success: true,
      message: "Connessione MySQL riuscita! Il database MariaDB/MySQL risponde correttamente."
    });
  } catch (err: any) {
    console.error("Test MySQL Fallito:", err);
    let detailedMsg = err.message || "Timeout o credenziali errate";
    if (err.code === "ECONNREFUSED") {
      detailedMsg = `Connessione rifiutata (${dbHost}:${dbPort || 3306}). Verifica che il server MySQL sia avviato e che accetti connessioni esterne (bind-address = 0.0.0.0).`;
    } else if (err.code === "ETIMEDOUT") {
      detailedMsg = `Timeout di connessione verso ${dbHost}. Se stai usando 'localhost', nota che l'app gira in un container Cloud e non vede il localhost del tuo computer. Occorre un indirizzo IP/Host pubblico.`;
    } else if (err.code === "ER_ACCESS_DENIED_ERROR") {
      detailedMsg = `Accesso negato per l'utente '${dbUser}'@'%' (password errata o utente privo di permessi per connessioni remote).`;
    } else if (err.code === "ENOTFOUND") {
      detailedMsg = `Impossibile risolvere l'host '${dbHost}'. Verifica che l'indirizzo o il nome di dominio sia corretto.`;
    }

    res.status(500).json({
      success: false,
      message: detailedMsg,
      errorCode: err.code
    });
  }
});

router.post("/setup-save", async (req, res) => {
  const isConfigured = !!(process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  let isAuthorized = !isConfigured;

  if (isConfigured) {
    const token = req.cookies.admin_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, "animal-hub-secret") as any;
        if (decoded && decoded.role === "ADMIN") {
          isAuthorized = true;
        }
      } catch (err) {}
    }
  }

  if (!isAuthorized) {
    return res.status(403).json({ error: "Accesso negato. La piattaforma è già configurata. Solo un amministratore loggato può modificare le chiavi." });
  }

  const { 
    dbHost, dbUser, dbPass, dbName, dbPort,
    apiKey, authDomain, projectId, storageBucket, appId, databaseId, serviceAccountKey 
  } = req.body;

  if (process.env.VERCEL) {
    return res.json({
      success: true,
      isVercel: true,
      message: "Configurazione validata con successo! Tuttavia, in ambiente serverless Vercel il filesystem è di sola lettura, quindi non possiamo scrivere sul file .env. Segui la guida per inserire le chiavi direttamente nel pannello di Vercel."
    });
  }

  const fs = await import("fs");
  const path = await import("path");

  try {
    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

    const updateEnvVar = (content: string, key: string, value: string): string => {
      const regex = new RegExp(`^${key}=.*$`, "m");
      const newLine = `${key}="${value.replace(/"/g, '\\"')}"`;
      if (regex.test(content)) {
        return content.replace(regex, newLine);
      } else {
        return content + (content.endsWith("\n") ? "" : "\n") + newLine + "\n";
      }
    };

    let updatedContent = envContent;
    if (dbHost) updatedContent = updateEnvVar(updatedContent, "DB_HOST", dbHost);
    if (dbUser) updatedContent = updateEnvVar(updatedContent, "DB_USER", dbUser);
    if (dbPass !== undefined) updatedContent = updateEnvVar(updatedContent, "DB_PASS", dbPass);
    if (dbName) updatedContent = updateEnvVar(updatedContent, "DB_NAME", dbName);
    if (dbPort) updatedContent = updateEnvVar(updatedContent, "DB_PORT", dbPort);

    if (apiKey) updatedContent = updateEnvVar(updatedContent, "VITE_FIREBASE_API_KEY", apiKey);
    if (authDomain) updatedContent = updateEnvVar(updatedContent, "VITE_FIREBASE_AUTH_DOMAIN", authDomain);
    if (projectId) updatedContent = updateEnvVar(updatedContent, "VITE_FIREBASE_PROJECT_ID", projectId);
    if (storageBucket) updatedContent = updateEnvVar(updatedContent, "VITE_FIREBASE_STORAGE_BUCKET", storageBucket);
    if (appId) updatedContent = updateEnvVar(updatedContent, "VITE_FIREBASE_APP_ID", appId);
    if (databaseId) updatedContent = updateEnvVar(updatedContent, "VITE_FIREBASE_DATABASE_ID", databaseId);
    if (serviceAccountKey) updatedContent = updateEnvVar(updatedContent, "FIREBASE_SERVICE_ACCOUNT_KEY", serviceAccountKey);

    fs.writeFileSync(envPath, updatedContent, "utf8");

    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const jsonConfig = {
      apiKey: apiKey || "",
      authDomain: authDomain || "",
      projectId: projectId || "",
      storageBucket: storageBucket || "",
      appId: appId || "",
      firestoreDatabaseId: databaseId || "(default)"
    };
    fs.writeFileSync(configPath, JSON.stringify(jsonConfig, null, 2), "utf8");

    if (dbHost) process.env.DB_HOST = dbHost;
    if (dbUser) process.env.DB_USER = dbUser;
    if (dbPass !== undefined) process.env.DB_PASS = dbPass;
    if (dbName) process.env.DB_NAME = dbName;
    if (dbPort) process.env.DB_PORT = dbPort;

    if (apiKey) process.env.VITE_FIREBASE_API_KEY = apiKey;
    if (authDomain) process.env.VITE_FIREBASE_AUTH_DOMAIN = authDomain;
    if (projectId) process.env.VITE_FIREBASE_PROJECT_ID = projectId;
    if (storageBucket) process.env.VITE_FIREBASE_STORAGE_BUCKET = storageBucket;
    if (appId) process.env.VITE_FIREBASE_APP_ID = appId;
    if (databaseId) process.env.VITE_FIREBASE_DATABASE_ID = databaseId;
    if (serviceAccountKey) process.env.FIREBASE_SERVICE_ACCOUNT_KEY = serviceAccountKey;

    res.json({
      success: true,
      isVercel: false,
      message: "Configurazione salvata con successo nel file .env!"
    });
  } catch (err: any) {
    console.error("Errore salvataggio config setup:", err);
    res.status(500).json({ error: "Errore durante il salvataggio locale", message: err.message });
  }
});

router.get("/firebase-diagnostic", requireAuth(["ADMIN"]), async (req, res) => {
  const fs = await import("fs");
  const path = await import("path");
  const admin = await import("firebase-admin");
  const { getFirestore: getFirestoreAdmin } = await import("firebase-admin/firestore");

  const client = {
    hasApiKey: !!(process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    hasAuthDomain: !!(process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    hasProjectId: !!(process.env.VITE_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    hasAppId: !!(process.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
    hasStorageBucket: !!(process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    databaseId: process.env.VITE_FIREBASE_DATABASE_ID || '',
  };

  let hasServiceAccount = false;
  let isServiceAccountValid = false;
  let serverProjectId = '';
  let clientEmail = '';

  const saKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (saKey) {
    hasServiceAccount = true;
    try {
      const parsed = JSON.parse(saKey);
      isServiceAccountValid = true;
      serverProjectId = parsed.project_id || '';
      clientEmail = parsed.client_email || '';
    } catch (e) {
      isServiceAccountValid = false;
    }
  }

  let envAndConfigMatch = true;
  const mismatchFields: string[] = [];

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      const apiKeyEnv = process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (apiKeyEnv && apiKeyEnv !== config.apiKey) {
        envAndConfigMatch = false;
        mismatchFields.push('apiKey');
      }
      
      const authDomainEnv = process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
      if (authDomainEnv && authDomainEnv !== config.authDomain) {
        envAndConfigMatch = false;
        mismatchFields.push('authDomain');
      }

      const projectIdEnv = process.env.VITE_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (projectIdEnv && projectIdEnv !== config.projectId) {
        envAndConfigMatch = false;
        mismatchFields.push('projectId');
      }

      const appIdEnv = process.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
      if (appIdEnv && appIdEnv !== config.appId) {
        envAndConfigMatch = false;
        mismatchFields.push('appId');
      }
    }
  } catch (e) {
    envAndConfigMatch = false;
    mismatchFields.push('readError');
  }

  let adminConnected = false;
  let adminPingError: string | undefined = undefined;

  if (hasServiceAccount && isServiceAccountValid) {
    try {
      let testDb: any = null;
      if (!admin.default.apps.length) {
        const parsed = JSON.parse(saKey!);
        const tempApp = admin.default.initializeApp({
          credential: admin.default.credential.cert(parsed)
        }, 'diagnostic-temp');
        
        let dbId: string | undefined = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
        if (!dbId && process.env.VERCEL !== "1") {
          try {
            const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
            if (fs.existsSync(configPath)) {
              const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              dbId = config.firestoreDatabaseId;
            }
          } catch(e) {}
        }
        testDb = dbId ? getFirestoreAdmin(tempApp, dbId) : getFirestoreAdmin(tempApp);
      } else {
        let dbId: string | undefined = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
        if (!dbId && process.env.VERCEL !== "1") {
          try {
            const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
            if (fs.existsSync(configPath)) {
              const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              dbId = config.firestoreDatabaseId;
            }
          } catch(e) {}
        }
        testDb = dbId ? getFirestoreAdmin(admin.default.app(), dbId) : getFirestoreAdmin(admin.default.app());
      }

      if (testDb) {
        await testDb.collection('registro_anagrafica').limit(1).get();
        adminConnected = true;
      }
    } catch (e: any) {
      adminConnected = false;
      adminPingError = e.message;
    }
  }

  res.json({
    success: true,
    client,
    server: {
      hasServiceAccount,
      isServiceAccountValid,
      projectId: serverProjectId,
      clientEmail
    },
    firestore: {
      adminConnected,
      adminPingError
    },
    sync: {
      envAndConfigMatch,
      mismatchFields
    }
  });
});

router.get("/proposal", async (req, res) => {
  const fs = await import("fs");
  const path = await import("path");
  try {
    const filePath = path.join(process.cwd(), "01-proposta.md");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      res.json({ content });
    } else {
      res.status(404).json({ error: "Proposta non trovata" });
    }
  } catch (err: any) {
    console.error("Errore nel leggere 01-proposta.md:", err);
    res.status(500).json({ error: "Errore di lettura proposta", details: err.message });
  }
});

router.get("/interventi_logs", requireAuth(["ADMIN", "POLIZIA_LOCALE", "CANILE_SANITARIO", "VOLONTARIO"]), async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json([]);
  const comune = await getActiveComune();
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  
  const [rows] = await mysqlPool.execute("SELECT * FROM interventi_logs WHERE comune_key = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?", [comune, limit, offset]);
  res.json({ data: rows, nextOffset: offset + limit });
});

export default router;
