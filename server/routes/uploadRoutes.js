import express from "express";
import upload from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import fs from "fs";

const router = express.Router();

/* =========================
   UPLOAD IMAGE / VIDEO
========================= */
router.post("/image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const isVideo = req.file.mimetype?.startsWith("video/");
    const targetFolder = req.body.folder || "mtc-padikuppam/website/images";

    const result = await uploadToCloudinary(req.file.path, {
      folder: targetFolder,
      resource_type: isVideo ? "video" : "image"
    });

    res.status(200).json({
      success: true,
      url: result.url || result.optimized_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      savings: result.savings,
      savingsPercentage: result.savingsPercentage,
      status: result.status
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Cleanup error in uploadRoutes:", e);
      }
    }
  }
});

export default router;