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

/* =========================
   CORS
========================= */
app.use(
  cors({
    origin: "*",
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json({ limit: "50mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 API running",
  });
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/pastors", pastorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/gallery", galleryRoutes);

/* =========================
   START SERVER
========================= */
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(
        `🚀 Server running on ${PORT}`
      );
    });
  } catch (err) {
    console.error(err);
  }
};

startServer();