import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

// ROUTES
import uploadRoutes from "./routes/uploadRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import pastorRoutes from "./routes/pastor.routes.js";
import adminRoutes from "./routes/adminRoutes.js";
import galleryRoutes from "./routes/gallery.routes.js";

const app = express();

/* MIDDLEWARE */
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* HEALTH CHECK */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 API is running (PRO MAX)",
    time: new Date().toISOString(),
  });
});

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/pastors", pastorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/gallery", galleryRoutes);

/* START SERVER */
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log("🚀 Server running on port", PORT);
    });
  } catch (err) {
    console.error("❌ Server failed:", err.message);
  }
};

startServer();