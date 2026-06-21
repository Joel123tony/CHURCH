import cloudinary from "../config/cloudinary.js";

/* ================================
   SAFE CLOUDINARY UPLOAD
================================ */
export const uploadToCloudinary = (buffer, options = {}) => {
  const normalizedOptions =
    typeof options === "string" ? { folder: options } : options || {};

  const {
    folder = "church",
    resource_type = "auto",
    eager,
    transformation,
    quality,
    bit_rate,
    fetch_format,
    video_codec,
    format,
    ...restOptions
  } = normalizedOptions;

  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new Error("No file buffer provided"));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
        ...(eager ? { eager } : {}),
        ...(transformation ? { transformation } : {}),
        ...(quality ? { quality } : {}),
        ...(bit_rate ? { bit_rate } : {}),
        ...(fetch_format ? { fetch_format } : {}),
        ...(video_codec ? { video_codec } : {}),
        ...(format ? { format } : {}),
        ...restOptions,
      },
      (error, result) => {
        if (error) {
          console.error("âŒ Cloudinary Upload Error:", error);
          return reject(error);
        }

        if (!result || !result.secure_url) {
          return reject(new Error("Invalid Cloudinary response"));
        }

        resolve({
          url: result.secure_url,
          optimized_url:
            result?.eager?.find((item) => item?.secure_url)?.secure_url ||
            result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          bytes: result.bytes,
          eager: result.eager || [],
        });
      }
    );

    // safety wrapper (prevents infinite hang)
    uploadStream.on("error", (err) => {
      console.error("âŒ Stream Error:", err);
      reject(err);
    });

    uploadStream.end(buffer);
  });
};
