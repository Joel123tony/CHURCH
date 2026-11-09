import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { connectDB } from "./config/db.js";

/* ROUTES */
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import pastorRoutes from "./routes/pastor.routes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import eventRoutes from "./routes/eventRoutes.js";
import youtubeRoutes from "./routes/youtubeRoutes.js";
import contentRoutes from "./routes/content.routes.js";
import homeRoutes from "./routes/home.routes.js";

const envPath = fs.existsSync(path.join(process.cwd(), "server", ".env"))
  ? path.join(process.cwd(), "server", ".env")
  : path.join(process.cwd(), ".env");

dotenv.config({ path: envPath });
connectDB();

const app = express();

/* =========================
   CORS CONFIGURATION
========================= */
const normalizeOrigin = (o) => {
  if (!o) return "";
  return o
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
};

const allowedOrigins = [
  "https://mtcpadikuppam.netlify.app",
  "https://church-rp0n.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:4173",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(normalizeOrigin(process.env.FRONTEND_URL));
}

if (process.env.ALLOWED_ORIGINS) {
  const origins = process.env.ALLOWED_ORIGINS.split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
  allowedOrigins.push(...origins);
}

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalized)) return true;
  if (/^https?:\/\/([a-zA-Z0-9_-]+--)?mtcpadikuppam\.netlify\.app$/.test(normalized)) return true;
  if (/^https?:\/\/deploy-preview-\d+--mtcpadikuppam\.netlify\.app$/.test(normalized)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(normalized)) return true;
  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  optionsSuccessStatus: 200,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   ROUTES
========================= */
app.use("/api/home", homeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pastors", pastorRoutes);

/* FILE UPLOAD */
app.use("/api/upload", uploadRoutes);

/* GALLERY */
app.use("/api/gallery", galleryRoutes);

/* EVENTS */
app.use("/api/events", eventRoutes);

/* YOUTUBE */
app.use("/api/youtube", youtubeRoutes);

/* CMS CONTENT */
app.use("/api/content", contentRoutes);

/* =========================
   BACKGROUND JOBS
========================= */
import { cleanupExpiredAnnouncements } from "./utils/announcementCron.js";

// Run immediately on startup
cleanupExpiredAnnouncements();
// Run every hour
setInterval(cleanupExpiredAnnouncements, 60 * 60 * 1000);

/* =========================
   EXPORT
========================= */
export default app;
