import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import uploadRoutes from "./routes/upload.routes.js";

app.use("/api/upload", uploadRoutes);

dotenv.config();

/* =========================
   CONNECT DATABASE
========================= */
connectDB();

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(process.env.JWT_SECRET);
});