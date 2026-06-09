import express from "express";
import upload from "../middleware/upload.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/* =========================
   MEDIA UPLOAD (IMAGE + VIDEO)
========================= */
router.post("/media", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "church",
          resource_type: "auto", // supports images & videos
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      type: result.resource_type,
    });
  } catch (error) {
    console.error("MEDIA UPLOAD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Upload failed",
    });
  }
});

export default router;