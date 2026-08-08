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
   MIDDLEWARE
========================= */
app.use(cors());
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
   EXPORT
========================= */
export default app;
