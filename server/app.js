import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import pastorRoutes from "./routes/pastor.routes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import youtubeRoutes from "./routes/youtube.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pastors", pastorRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/youtube", youtubeRoutes);

app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

export default app;