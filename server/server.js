import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

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

const app = express();

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
   RATE LIMIT
========================= */
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
  })
);

/* =========================
   CORS
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
   BODY PARSER
========================= */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* =========================
   DB READY FLAG (🔥 NEW FIX)
========================= */
let dbReady = false;

/* =========================
   HEALTH CHECK (UPDATED)
========================= */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 API running",
    db: dbReady ? "connected" : "not-ready",
  });
});

/* =========================
   DB GUARD MIDDLEWARE (🔥 NEW FIX)
   prevents Pastor 500 crash spam
========================= */
app.use((req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({
      success: false,
      message: "Database not ready yet. Try again in a few seconds.",
    });
  }
  next();
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/pastors", pastorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/prayer", prayerRoutes);
app.use("/api/prayer-requests", prayerRequestRoutes);
app.use("/api/youtube", youtubeRoutes);

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
app.use((err, req, res, next) => {
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
    await connectDB();

    dbReady = true; // 🔥 IMPORTANT FIX

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log("==================================");
      console.log("🚀 SERVER RUNNING");
      console.log(`📡 Port: ${PORT}`);
      console.log("📍 API Base: /api");
      console.log("==================================");
    });
  } catch (err) {
    console.error("❌ DB CONNECTION FAILED:", err);
    dbReady = false;
    process.exit(1);
  }
};

startServer();
