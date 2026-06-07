import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import pastorRoutes from "./routes/pastor.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

// ROUTES
app.use("/api/pastors", pastorRoutes);

export default app;