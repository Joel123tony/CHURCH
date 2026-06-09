import cloudinary from "../config/cloudinary.js";

/* =========================================
   UPLOAD BUFFER → CLOUDINARY (IMAGE + VIDEO)
========================================= */
export const uploadToCloudinary = (buffer, folder = "church") => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new Error("No file buffer provided"));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,

        // 🔥 CRITICAL: supports image + video automatically
        resource_type: "auto",

        // optional safety
        timeout: 60000,
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary Upload Error:", error);
          return reject(error);
        }

        if (!result) {
          return reject(new Error("Cloudinary returned empty result"));
        }

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          type: result.resource_type,
          size: result.bytes,
        });
      }
    );

    // 🔥 IMPORTANT: send buffer
    stream.end(buffer);
  });
};