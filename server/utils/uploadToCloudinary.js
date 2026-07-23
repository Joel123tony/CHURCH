import cloudinary from "../config/cloudinary.js";
import { compressImage, compressVideo } from "./compressMedia.js";

export const uploadToCloudinary = async (rawBuffer, options = {}) => {
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

  let processedData;

  try {
    if (resource_type === "image") {
      processedData = await compressImage(rawBuffer);
    } else if (resource_type === "video") {
      processedData = await compressVideo(rawBuffer);
    } else {
      processedData = {
        buffer: rawBuffer,
        originalSize: rawBuffer.length,
        compressedSize: rawBuffer.length,
        isCompressed: false
      };
    }
  } catch {
    processedData = {
      buffer: rawBuffer,
      originalSize: rawBuffer.length,
      compressedSize: rawBuffer.length,
      isCompressed: false
    };
  }

  const { buffer, originalSize, compressedSize, isCompressed } = processedData;

  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new Error("No file buffer provided"));
    }

    const timeoutId = setTimeout(() => {
      console.error("[UPLOAD TRACE] X. Cloudinary upload timed out after 5 minutes");
      reject(new Error("Cloudinary upload timed out. Please try again."));
    }, 5 * 60 * 1000);

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
        clearTimeout(timeoutId);
        if (error) {
          console.error("[UPLOAD TRACE] X. Cloudinary stream callback Error:", error);
          return reject(error);
        }

        if (!result || !result.secure_url) {
          console.error("[UPLOAD TRACE] X. Cloudinary missing secure_url in result:", result);
          return reject(new Error("Invalid Cloudinary response"));
        }

        const savings = originalSize - compressedSize;
        const savingsPercentage = originalSize > 0 ? Math.round((savings / originalSize) * 100) : 0;

        resolve({
          url: result.secure_url,
          optimized_url:
            result?.eager?.find((item) => item?.secure_url)?.secure_url ||
            result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          folder: result.folder || folder,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration,
          eager: result.eager || [],
          originalSize,
          compressedSize,
          savings: Math.max(0, savings),
          savingsPercentage: Math.max(0, savingsPercentage),
          status: isCompressed ? "Compressed" : "Already Optimized"
        });
      }
    );

    uploadStream.on("error", (error) => {
      clearTimeout(timeoutId);
      console.error("[UPLOAD TRACE] X. Stream Error event emitted:", error);
      reject(error);
    });

    uploadStream.end(buffer);
  });
};
