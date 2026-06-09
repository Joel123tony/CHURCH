import cloudinary from "../config/cloudinary.js";

export const uploadImage = async (req, res) => {
  try {
    console.log("📦 FILE RECEIVED:", req.file);

    // ✅ validate file
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or invalid file buffer",
      });
    }

    // 🔥 upload to cloudinary (image + video support)
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "church",
          resource_type: "auto", // ✅ IMPORTANT FIX (image + video)
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary error:", error);
            return reject(error);
          }
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    // 🔥 safe fallback for url
    const url = result?.secure_url || result?.url;

    if (!url) {
      return res.status(500).json({
        success: false,
        message: "Upload failed: no URL returned from Cloudinary",
      });
    }

    return res.json({
      success: true,
      url,
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