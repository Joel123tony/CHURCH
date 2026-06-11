import cloudinary from "../config/cloudinary.js";

/* ================================
   SAFE CLOUDINARY UPLOAD
================================ */
export const uploadToCloudinary = (buffer, folder = "church") => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new Error("No file buffer provided"));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary Upload Error:", error);
          return reject(error);
        }

        if (!result || !result.secure_url) {
          return reject(new Error("Invalid Cloudinary response"));
        }

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          bytes: result.bytes,
        });
      }
    );

    // safety wrapper (prevents infinite hang)
    uploadStream.on("error", (err) => {
      console.error("❌ Stream Error:", err);
      reject(err);
    });

    uploadStream.end(buffer);
  });
};