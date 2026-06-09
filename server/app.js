import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminAuth.routes.js";
import pastorRoutes from "./routes/pastor.routes.js";

const app = express();

/* =========================
   MIDDLEWARE ORDER (VERY IMPORTANT)
========================= */
app.use(cors());
app.use(express.json());   // 🔥 MUST be BEFORE routes
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pastors", pastorRoutes);

export default app;