import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = fs.existsSync(path.join(process.cwd(), "server", ".env"))
  ? path.join(process.cwd(), "server", ".env")
  : path.join(process.cwd(), ".env");

dotenv.config({ path: envPath });

/* =========================
   CLOUDINARY SAFE CONFIG
========================= */
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dhqc0n23k";
const apiKey = process.env.CLOUDINARY_API_KEY || "147858671311895";
const apiSecret = process.env.CLOUDINARY_API_SECRET || "w9w03p-pKz3WLq4W6TykTn1ByiU";

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export default cloudinary;
