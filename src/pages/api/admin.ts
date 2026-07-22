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

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });
  try {
    const [rows]: any = await mysqlPool.execute("SELECT * FROM admin_users WHERE username = ?", [username]);
    const user = rows[0];
    const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const ip = ipHeader.substring(0, 45);
    const userAgent = (req.headers['user-agent'] || '').substring(0, 255);

    if (user && await bcrypt.compare(password, user.password_hash)) {
      if (user.email) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const expiresAtStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19);
        await mysqlPool.execute(
          "INSERT INTO user_otps (email, otp_code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp_code = ?, expires_at = ?",
          [user.email, otp, expiresAtStr, otp, expiresAtStr]
        );
        
        try {
          await sendOtpEmail(user.email, otp, true);
        } catch (mailErr: any) {
          console.error(`[ADMIN OTP ERROR] Errore nell'invio della mail reale a ${user.email}:`, mailErr.message);
        }

        await mysqlPool.execute(
          "INSERT INTO admin_logs (username, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
          [username, "LOGIN_REQUEST", "Richiesto OTP per login", ip, userAgent]
        );

        return res.json({ success: true, requiresOtp: true, email: user.email });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, comune_key: user.comune_key },
        "animal-hub-secret",
        { expiresIn: "8h" }
      );
      res.cookie("admin_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 });
      
      await mysqlPool.execute(
        "INSERT INTO admin_logs (username, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
        [username, "LOGIN_SUCCESS", "Login effettuato con successo (No OTP)", ip, userAgent]
      );
      
      notifyAdminLoginAttempt(username, true, ip, userAgent).catch(() => {});
      return res.json({ success: true, user: { username: user.username, role: user.role } });
    }

    notifyAdminLoginAttempt(username, false, ip, userAgent).catch(() => {});
    res.status(401).json({ error: "Credenziali non valide" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Errore server" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email e OTP obbligatori" });
  if (!mysqlPool || !getIsMysqlHealthy()) return res.status(500).json({ error: "DB Error" });

  try {
    const [otpRows]: any = await mysqlPool.execute("SELECT * FROM user_otps WHERE email = ? AND otp_code = ?", [email, otp]);
    const otpRecord = otpRows[0];

    if (!otpRecord || parseExpiresAt(otpRecord.expires_at) < new Date()) {
      return res.status(401).json({ error: "Codice OTP non valido o scaduto" });
    }

    const [userRows]: any = await mysqlPool.execute("SELECT * FROM admin_users WHERE email = ?", [email]);
    const user = userRows[0];

    if (!user) return res.status(404).json({ error: "Utente non trovato" });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, comune_key: user.comune_key },
      "animal-hub-secret",
      { expiresIn: "8h" }
    );
    res.cookie("admin_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 });

    const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const ip = ipHeader.substring(0, 45);
    const userAgent = (req.headers['user-agent'] || '').substring(0, 255);

    await mysqlPool.execute(
      "INSERT INTO admin_logs (username, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
      [user.username, "OTP_VERIFIED", "OTP verificato con successo", ip, userAgent]
    );

    await mysqlPool.execute("DELETE FROM user_otps WHERE email = ?", [email]);
    notifyAdminOtpVerify(user.username, true, ip, userAgent).catch(() => {});

    res.json({ success: true, user: { username: user.username, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Errore server" });
  }
});

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
    res.status(500).json({
      success: false,
      message: `Impossibile connettersi al database MySQL: ${err.message || 'Timeout o credenziali errate'}`
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
