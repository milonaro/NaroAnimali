import express from "express";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { 
  mysqlPool, 
  dbInitPromise, 
  getIsMysqlHealthy, 
  seedAdminUsers 
} from "./src/lib/server-utils.js";

// Routers
import adminRouter from "./src/pages/api/admin.js";
import publicRouter from "./src/pages/api/public.js";
import aiRouter from "./src/pages/api/ai.js";
import registroRouter from "./src/pages/api/registro.js";
import adozioniRouter from "./src/pages/api/adozioni.js";
import entiRouter from "./src/pages/api/enti.js";
import otpRouter from "./src/pages/api/otp.js";
import segnalazioniRouter from "./src/pages/api/segnalazioni.js";
import comuniRouter from "./src/pages/api/comuni.js";
import utentiRouter from "./src/pages/api/utenti.js";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Async DB initialization middleware
let isDbInitialized = false;
app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    try {
      await dbInitPromise;
      await seedAdminUsers();
      isDbInitialized = true;
    } catch (err) {
      console.error("Database initialization failed:", err);
    }
  }
  next();
});

// API Routes
app.use("/api/otp", otpRouter);
app.use("/api/admin", adminRouter);
app.use("/api/interventi_logs", (req, res, next) => {
  req.url = "/interventi_logs";
  adminRouter(req, res, next);
});
app.use("/api/ai", aiRouter);
app.use("/api/chat", aiRouter); // Backward compatibility
app.use("/api/registro", registroRouter);
app.use("/api/adozioni", adozioniRouter);
app.use("/api/segnalazioni", segnalazioniRouter);
app.use("/api/comuni", comuniRouter);
app.use("/api/utenti", utentiRouter);
app.use("/api", entiRouter);
app.use("/api", publicRouter);

// Vite / Static setup
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
  }).catch((err) => {
    console.error("Failed to start Vite middleware:", err);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Start standalone server if not on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AnimalHub PA Server running on http://localhost:${PORT}`);
  });
}

export default app;
module.exports = app;

