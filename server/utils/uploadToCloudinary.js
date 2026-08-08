import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import { compressImage, compressVideo } from "./compressMedia.js";

export const uploadToCloudinary = async (filePath, options = {}) => {
  const normalizedOptions = typeof options === "string" ? { folder: options } : options || {};
  
  const {
    folder = "church",
    resource_type = "auto",
    public_id,
    ...restOptions
  } = normalizedOptions;

  return new Promise(async (resolve, reject) => {
    if (!filePath) {
      return reject(new Error("No file path provided"));
    }

    let finalFilePath = filePath;
    let originalSize = 0;
    let compressedSize = 0;
    let isCompressed = false;

    // Local Compression Step (except for RAW/PDFs)
    try {
      if (resource_type === "image") {
        const result = await compressImage(filePath);
        finalFilePath = result.filePath;
        originalSize = result.originalSize;
        compressedSize = result.compressedSize;
        isCompressed = result.isCompressed;
      } else if (resource_type === "video") {
        const result = await compressVideo(filePath);
        finalFilePath = result.filePath;
        originalSize = result.originalSize;
        compressedSize = result.compressedSize;
        isCompressed = result.isCompressed;
      } else {
        originalSize = fs.statSync(filePath).size;
        compressedSize = originalSize;
      }
    } catch (err) {
      console.error("Compression error, proceeding with original:", err);
      originalSize = fs.statSync(filePath).size;
      compressedSize = originalSize;
    }

    const timeoutId = setTimeout(() => {
      console.error("[UPLOAD TRACE] X. Cloudinary upload timed out after 10 minutes");
      if (isCompressed && fs.existsSync(finalFilePath)) {
        try { fs.unlinkSync(finalFilePath); } catch (e) { /* ignore */ }
      }
      reject(new Error("Cloudinary upload timed out. Please try again."));
    }, 10 * 60 * 1000);

    cloudinary.uploader.upload(
      finalFilePath,
      {
        folder,
        resource_type,
        use_filename: true,
        unique_filename: true,
        ...(public_id ? { public_id } : {}),
        ...restOptions,
      },
      (error, result) => {
        clearTimeout(timeoutId);
        
        // Cleanup compressed temp file if it's different from the original multer temp file
        if (isCompressed && fs.existsSync(finalFilePath) && finalFilePath !== filePath) {
          try { fs.unlinkSync(finalFilePath); } catch (e) { /* ignore */ }
        }

        if (error) {
          console.error("Cloudinary upload Error:", error);
          return reject(error);
        }

        if (!result || !result.secure_url) {
          return reject(new Error("Invalid Cloudinary response"));
        }

        const savings = Math.max(0, originalSize - compressedSize);
        const savingsPercentage = originalSize > 0 ? Math.round((savings / originalSize) * 100) : 0;
        
        let status = "Uploaded";
        if (isCompressed) status = "Compressed";
        else if (resource_type !== "raw") status = "Already Optimized";

        resolve({
          url: result.secure_url,
          optimized_url: result.secure_url, // For backwards compatibility
          public_id: result.public_id,
          resource_type: result.resource_type,
          folder: result.folder || folder,
          
          originalSize,
          compressedSize,
          savings,
          savingsPercentage,
          status,
          
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration
        });
      }
    );
  });
};
