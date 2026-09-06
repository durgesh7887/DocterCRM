import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { adminRouter } from "./routes/admin.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { clinicRouter } from "./routes/clinic.routes.js";
import { exportRouter } from "./routes/export.routes.js";
import "./types/express.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  const allowedOrigins = env.corsOrigins.map((o) => o.trim().toLowerCase());
  
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const norm = origin.toLowerCase().trim();
      const isVercel = norm.endsWith(".vercel.app") || norm.includes(".vercel.app");
      const isRender = norm.endsWith(".onrender.com") || norm.includes(".onrender.com");
      const isLocalhost = norm.includes("localhost") || norm.includes("127.0.0.1");
      const isInList = allowedOrigins.some((allowed) => {
        const cleanAllowed = allowed.replace(/^https?:\/\//, "");
        const cleanOrigin = norm.replace(/^https?:\/\//, "");
        return cleanOrigin === cleanAllowed || norm === allowed;
      });

      if (isVercel || isRender || isLocalhost || isInList || env.nodeEnv === "development") {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With", "Accept"],
    exposedHeaders: ["Set-Cookie"],
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ success: true, message: "MedFlow API running", data: { ok: true } });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/clinics", clinicRouter);
  app.use("/api/v1", adminRouter);
  app.use("/api/v1", exportRouter);

  app.use(errorHandler);
  return app;
}
