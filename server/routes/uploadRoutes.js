import express from "express";
import upload from "../middleware/upload.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/* =========================
   OPTIMIZED UPLOAD (IMAGE + VIDEO)
========================= */
router.post("/image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "church",

          // 🚀 OPTIMIZATION SETTINGS
          resource_type: "auto",

          // IMAGE OPTIMIZATION
          transformation: [
            {
              quality: "auto:good",   // smart compression
              fetch_format: "auto",   // converts to webp/avif automatically
              width: 1600,            // prevents huge uploads
              crop: "limit"
            }
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      bytes: result.bytes,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;