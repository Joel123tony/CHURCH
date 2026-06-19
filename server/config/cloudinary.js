import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

/* =========================
   CLOUDINARY SAFE CONFIG
========================= */
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("❌ CLOUDINARY ENV MISSING!");
  console.error("Check CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

export default cloudinary;