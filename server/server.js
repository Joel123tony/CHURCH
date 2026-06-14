import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

import youtubeRoutes from "./routes/youtubeRoutes.js";

/* ROUTES */
import uploadRoutes from "./routes/uploadRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import pastorRoutes from "./routes/pastor.routes.js";
import adminRoutes from "./routes/adminRoutes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import eventRoutes from "./routes/eventRoutes.js";

const app = express();

/* TRUST PROXY */
app.set("trust proxy", 1);

/* CORS */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* PRE-FLIGHT */
app.options("*", cors());

/* BODY */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* HEALTH */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 API running",
  });
});

/* ROUTES (ONLY ONCE) */
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/pastors", pastorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/youtube", youtubeRoutes);
/* DEBUG 404 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

/* ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

/* START SERVER */
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log("🚀 Server running on", PORT);
      console.log("✅ /api/events loaded");
    });
  } catch (err) {
    console.error("DB ERROR:", err);
  }
};

startServer();