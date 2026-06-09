import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";

// Routes
import uploadRoutes from "./routes/uploadRoutes.js";

// Init app
const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   ROUTES
========================= */
app.get("/", (req, res) => {
  res.send("🚀 API is running");
});

app.use("/api/upload", uploadRoutes);

/* =========================
   DATABASE CONNECTION
========================= */
connectDB();

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});