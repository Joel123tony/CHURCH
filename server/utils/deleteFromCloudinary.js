import cloudinary from "./cloudinary.js";

const DEFAULT_CLOUD_NAME = "dhqc0n23k";
const DEFAULT_API_KEY = "147858671311895";
const DEFAULT_API_SECRET = "w9w03p-pKz3WLq4W6TykTn1ByiU";

export const deleteFromCloudinary = async (public_id, resource_type = "image") => {
  try {
    if (!public_id) {
      console.warn("⚠️ Cloudinary delete skipped: no public_id provided");
      return {
        success: false,
        message: "No public_id provided",
      };
    }

    console.log("🗑️ Deleting from Cloudinary:", public_id);

    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY || DEFAULT_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET || DEFAULT_API_SECRET;

    const result = await cloudinary.uploader.destroy(public_id, {
      cloud_name,
      api_key,
      api_secret,
      resource_type,
      invalidate: true,
    });

    console.log("✅ Cloudinary delete result:", result);

    return {
      success: true,
      result,
    };
  } catch (err) {
    console.error("❌ Cloudinary delete error:", err);
    return {
      success: false,
      message: err.message || "Cloudinary delete failed",
    };
  }
};
