import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

/* ROUTES */
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminAuth.routes.js";
import pastorRoutes from "./routes/pastor.routes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import galleryRoutes from "./routes/gallery.routes.js";

dotenv.config();
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

/* =========================
   EXPORT
========================= */
export default app;