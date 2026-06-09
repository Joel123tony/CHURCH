import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";

// =========================
// ROUTES
// =========================
import uploadRoutes from "./routes/uploadRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// (optional if you use these)
import pastorRoutes from "./routes/pastor.routes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

/* =========================
   SECURITY / MIDDLEWARE
========================= */
app.use(
  cors({
    origin: "*", // 🔥 replace with frontend URL in production
    credentials: true,
  })
);

// increase limits for images/videos
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 API is running (PRO MAX)",
    time: new Date().toISOString(),
  });
});

/* =========================
   API ROUTES
========================= */

// 🔥 AUTH ROUTES (LOGIN / REGISTER)
app.use("/api/auth", authRoutes);

// 🔥 FILE UPLOAD (Cloudinary)
app.use("/api/upload", uploadRoutes);

// 🔥 PASTOR ROUTES (if separated)
if (pastorRoutes) {
  app.use("/api/pastors", pastorRoutes);
}

// 🔥 ADMIN ROUTES (dashboard, pastors, sermons)
if (adminRoutes) {
  app.use("/api/admin", adminRoutes);
}

/* =========================
   DATABASE CONNECTION (SAFE + CLEAN)
========================= */
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();