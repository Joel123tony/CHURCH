import cloudinary from "../config/cloudinary.js";

export const uploadImage = async (req, res) => {
  try {
    console.log("📦 FILE RECEIVED:", req.file);

    // 🚨 VALIDATION FIX
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or invalid buffer",
      });
    }

    // 🔥 CLOUDINARY UPLOAD WRAPPER
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "church",
          resource_type: "auto", // supports image + video
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary error:", error);
            return reject(error);
          }
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    // 🔥 SAFE RESPONSE HANDLING
    if (!result) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary returned empty response",
      });
    }

    return res.status(200).json({
      success: true,
      url: result.secure_url || result.url,
      public_id: result.public_id,
      type: result.resource_type,
    });

  } catch (err) {
    console.error("❌ UPLOAD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
};