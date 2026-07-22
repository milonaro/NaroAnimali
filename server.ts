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

async function bootServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(cookieParser());

  // Wait for DB initialization
  try {
    await dbInitPromise;
    console.log("Database initialized and connected.");
    // Seed admin users if they don't exist
    await seedAdminUsers();
  } catch (err) {
    console.error("Critical: Database initialization failed:", err);
  }

  // API Routes
  app.use("/api/otp", otpRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/chat", aiRouter); // Backward compatibility
  app.use("/api/registro", registroRouter);
  app.use("/api/adozioni", adozioniRouter);
  app.use("/api/segnalazioni", segnalazioniRouter);
  app.use("/api/comuni", comuniRouter);
  app.use("/api/utenti", utentiRouter);
  app.use("/api", entiRouter);
  app.use("/api", publicRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AnimalHub PA Server running on http://localhost:${PORT}`);
  });
}

bootServer().catch((err) => {
  console.error("Failed to start server:", err);
});
