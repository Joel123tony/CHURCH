import cloudinary from "../config/cloudinary.js";
import Gallery from "../models/Gallery.js";

export const uploadImage = async (req, res) => {
  try {
    console.log("📦 FILE RECEIVED:", req.file);

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or invalid buffer",
      });
    }

    // 🔥 UPLOAD TO CLOUDINARY
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "church",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    if (!result) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary returned empty response",
      });
    }

    // 🔥 SAVE TO DATABASE (THIS WAS MISSING)
    const media = await Gallery.create({
      title: req.body.title || "Untitled",
      url: result.secure_url,
      public_id: result.public_id,
      mediaType: result.resource_type === "video" ? "video" : "image",
      showInClient: false,
    });

    return res.status(201).json({
      success: true,
      data: media,
    });

  } catch (err) {
    console.error("❌ UPLOAD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
};