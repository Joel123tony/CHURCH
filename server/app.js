import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import uploadRoutes from "./routes/uploadRoutes.js";

app.use("/api/gallery", galleryRoutes);

/* ROUTES */
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminAuth.routes.js";
import pastorRoutes from "./routes/pastor.routes.js";
import uploadRoutes from "./routes/upload.routes.js"; // ✅ ADD THIS

dotenv.config();
connectDB();

const app = express();

/* MIDDLEWARE */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pastors", pastorRoutes);

/* ✅ FIX: ADD UPLOAD ROUTE */
app.use("/api/upload", uploadRoutes);

export default app;