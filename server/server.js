import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";

// Routes
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();

/* =========================
   SECURITY / MIDDLEWARE
========================= */
app.use(
  cors({
    origin: "*", // 🔥 change to your frontend URL in production
    credentials: true,
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

/* =========================
   HEALTH CHECK ROUTE
========================= */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 API is running",
    time: new Date().toISOString(),
  });
});

/* =========================
   ROUTES
========================= */
app.use("/api/upload", uploadRoutes);

/* =========================
   DB CONNECTION (SAFE FIX)
========================= */
connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err.message);
  });

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});