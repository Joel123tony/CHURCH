import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";

/* ROUTES */
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminAuth.routes.js";
import pastorRoutes from "./routes/pastor.routes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import eventRoutes from "./routes/eventRoutes.js";
import youtubeRoutes from "./routes/youtubeRoutes.js";   // ✅ ADD THIS

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
connectDB();

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pastors", pastorRoutes);

/* FILE UPLOAD */
app.use("/api/upload", uploadRoutes);

/* GALLERY */
app.use("/api/gallery", galleryRoutes);

/* EVENTS */
app.use("/api/events", eventRoutes);

/* YOUTUBE ✅ FIXED */
app.use("/api/youtube", youtubeRoutes);

/* =========================
   EXPORT
========================= */
export default app;
