import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = fs.existsSync(path.join(process.cwd(), "server", ".env"))
  ? path.join(process.cwd(), "server", ".env")
  : path.join(process.cwd(), ".env");

dotenv.config({ path: envPath });

import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";

/* ROUTES */
import uploadRoutes from "./routes/uploadRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import pastorRoutes from "./routes/pastor.routes.js";
import adminRoutes from "./routes/adminRoutes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import eventRoutes from "./routes/eventRoutes.js";
import prayerRoutes from "./routes/prayer.js";
import prayerRequestRoutes from "./routes/prayerRequest.routes.js";
import youtubeRoutes from "./routes/youtubeRoutes.js";
import contentRoutes from "./routes/content.routes.js";
import translateRoutes from "./routes/translate.routes.js";
import bookRoutes from "./routes/bookRoutes.js";
import donationRoutes, { donationWebhookHandler } from "./routes/donationRoutes.js";
import compression from "compression";

const app = express();

app.use(compression());

/* =========================
   TRUST PROXY (Render safe)
========================= */
app.set("trust proxy", 1);

/* =========================
   SECURITY HEADERS
========================= */
app.use(helmet());

/* =========================
   LOGGING
========================= */
app.use(morgan("dev"));

/* =========================
   CORS  (must come BEFORE rate-limiter so
          429 responses still carry CORS headers)
========================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://church-rp0n.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());

/* =========================
   RATE LIMIT  (after CORS; skip preflight)
========================= */
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    skip: (req) => req.method === "OPTIONS",
  })
);

/* =========================
   WEBHOOKS (Must be before body-parser)
========================= */
app.post("/api/donations/webhook", express.raw({ type: "application/json" }), donationWebhookHandler);
console.log("Razorpay webhook route enabled: /api/donations/webhook");

/* =========================
   BODY PARSER
========================= */
app.use(express.json({ limit: "2000mb" }));
app.use(express.urlencoded({ extended: true, limit: "2000mb" }));

/* =========================
   PERFORMANCE LOGGING
========================= */
import { perfMiddleware } from "./utils/perfTracker.js";
app.use(perfMiddleware);

/* =========================
   TRANSLATE & SONGS (no DB required)
========================= */
app.use("/api/translate", translateRoutes);

import mongoose from "mongoose";

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 API running",
    db: mongoose.connection.readyState === 1 ? "connected" : "not-ready",
  });
});

app.get("/api/health", async (req, res) => {
  if (req.query.youtube) {
    try {
      const { resilientFetch } = await import("./utils/resilientFetch.js");
      const apiKey = process.env.YOUTUBE_API_KEY;
      const hasKey = !!apiKey;
      const keyPrefix = hasKey ? apiKey.substring(0, 5) : "MISSING";
      const encQuery = encodeURIComponent("test song");
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encQuery}&type=video&key=${apiKey}`;

      let fetchResult = "none";
      try {
        const ytRes = await resilientFetch(url, { timeout: 10000 });
        fetchResult = { status: ytRes.status, data: ytRes.data };
      } catch (err) {
        fetchResult = {
          error: err.message,
          status: err.response?.status,
          data: err.response?.data
        };
      }
      return res.status(200).json({ status: "ok", hasKey, keyPrefix, fetchResult });
    } catch (e) {
      return res.status(500).json({ status: "error", error: e.message });
    }
  }
  res.status(200).json({ status: "ok" });
});

import homeRoutes from "./routes/home.routes.js";

/* =========================
   ROUTES
========================= */
app.use("/api/home", homeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/pastors", pastorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/prayer", prayerRoutes);
app.use("/api/prayer-requests", prayerRequestRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/donations", donationRoutes);

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

/* =========================
   GLOBAL ERROR HANDLER (IMPROVED DEBUG)
========================= */
app.use((err, req, res, _next) => {
  void _next;
  const isPastorRoute = req.originalUrl?.startsWith("/api/pastors");
  const isValidationLike =
    err?.name === "ValidationError" ||
    err?.name === "CastError" ||
    err?.name === "ZodError" ||
    err?.isJoi ||
    err?.name === "MulterError" ||
    err?.name === "SyntaxError" ||
    err?.code === "LIMIT_FILE_SIZE" ||
    /Only images|No file uploaded|Invalid pastor payload/i.test(
      err?.message || ""
    );

  if (err?.stack) {
    console.error("🔥 SERVER ERROR STACK:", err.stack);
  } else {
    console.error("🔥 SERVER ERROR:", err);
  }

  if (isPastorRoute && isValidationLike) {
    return res.status(400).json({
      success: false,
      message:
        err?.code === "LIMIT_FILE_SIZE"
          ? "Uploaded file is too large"
          : err?.message || "Invalid pastor payload",
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   START SERVER
========================= */
const startServer = async () => {
  try {
    const t0 = performance.now();
    await connectDB();
    const dbConnectedMs = Math.round(performance.now() - t0);
    console.log(`⏱️ MongoDB connected in ${dbConnectedMs} ms`);

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      const listenMs = Math.round(performance.now() - t0);
      console.log("==================================");
      console.log("🚀 SERVER RUNNING & READY FOR HTTP REQUESTS");
      console.log(`📡 Port: ${PORT}`);
      console.log(`📍 API Base: /api`);
      console.log(`⏱️ Time to listen: ${listenMs} ms`);
      console.log("==================================");

      // Defer background cron jobs and workers asynchronously so Express accepts HTTP requests immediately
      setImmediate(async () => {
        try {
          console.log("✅ Background initialized successfully");
        } catch (workerErr) {
          console.error("⚠️ Background worker initialization error:", workerErr);
        }
      });
    });

    // Prevent connection drops during long video FFmpeg compression
    server.timeout = 10 * 60 * 1000;
    server.keepAliveTimeout = 10 * 60 * 1000;
    server.headersTimeout = 10 * 60 * 1000;
  } catch (err) {
    console.error("❌ DB CONNECTION FAILED:", err);
    // Do NOT exit process so non-DB routes keep working
  }
};

startServer();
