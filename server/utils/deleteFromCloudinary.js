import cloudinary from "./cloudinary.js";

export const deleteFromCloudinary = async (public_id) => {
  try {
    if (!public_id) return;

    const result = await cloudinary.uploader.destroy(public_id);

    return result;
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    throw err;
  }
};