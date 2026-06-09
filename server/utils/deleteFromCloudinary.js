import cloudinary from "./cloudinary.js";

export const deleteFromCloudinary = async (public_id, resource_type = "image") => {
  try {
    // ✅ validation
    if (!public_id) {
      console.warn("⚠️ Cloudinary delete skipped: no public_id provided");
      return {
        success: false,
        message: "No public_id provided",
      };
    }

    console.log("🗑️ Deleting from Cloudinary:", public_id);

    // 🔥 delete asset
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type, // supports image / video if needed
      invalidate: true, // clears CDN cache
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