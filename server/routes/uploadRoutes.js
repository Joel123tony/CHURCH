import express from "express";
import upload from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import fs from "fs";

const router = express.Router();

/* =========================
   UPLOAD IMAGE / VIDEO
========================= */
const handleUpload = (req, res, next) => {
  // Support both "file" and "image" field names seamlessly
  const multerUpload = upload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]);

  multerUpload(req, res, (err) => {
    if (err) {
      console.error("[UPLOAD] Multer error:", err.message);
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    }

    // Normalize req.file from fields
    if (!req.file) {
      if (req.files?.file?.[0]) {
        req.file = req.files.file[0];
      } else if (req.files?.image?.[0]) {
        req.file = req.files.image[0];
      }
    }

    next();
  });
};

router.post("/image", handleUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const isVideo = req.file.mimetype?.startsWith("video/");
    const targetFolder = req.body.folder || "mtc-padikuppam/website/images";

    console.log(`[UPLOAD] Starting Cloudinary upload for: ${req.file.originalname} (${req.file.size} bytes) -> ${targetFolder}`);

    const result = await uploadToCloudinary(req.file.path, {
      folder: targetFolder,
      resource_type: isVideo ? "video" : "image",
    });

    console.log(`[UPLOAD] Cloudinary upload successful: ${result.url}`);

    return res.status(200).json({
      success: true,
      url: result.url || result.optimized_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      savings: result.savings,
      savingsPercentage: result.savingsPercentage,
      status: result.status,
    });
  } catch (err) {
    console.error("[UPLOAD] Upload failed:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to upload image",
    });
  } finally {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Cleanup error in uploadRoutes:", e.message);
      }
    }
  }
});

export default router;
