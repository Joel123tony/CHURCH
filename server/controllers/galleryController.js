import Gallery from "../models/Gallery.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

/* =========================
   UPLOAD MEDIA
========================= */
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    const media = await Gallery.create({
      title: req.body.title || "Untitled",
      url: result.url,
      public_id: result.public_id,
      mediaType: result.resource_type === "video" ? "video" : "image",
      showInClient: req.body.showInClient === "true",
    });

    res.status(201).json({
      success: true,
      data: media,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   GET ALL MEDIA (ADMIN)
========================= */
export const getAllMedia = async (req, res) => {
  try {
    const media = await Gallery.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: media,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   GET CLIENT MEDIA ONLY
========================= */
export const getClientMedia = async (req, res) => {
  try {
    const media = await Gallery.find({
      clientPriority: { $ne: null },
    })
      .sort({ clientPriority: 1 })
      .limit(4);

    res.json({
      success: true,
      data: media,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
/* =========================
   UPDATE MEDIA
========================= */
export const uploadMedia = async (req, res) => {
  try {
    console.log("👉 FILE:", req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const buffer = req.file.buffer || null;

    if (!buffer) {
      return res.status(400).json({
        success: false,
        message: "File buffer missing (multer issue)",
      });
    }

    const result = await uploadToCloudinary(buffer);

    const media = await Gallery.create({
      title: req.body.title || "Untitled",
      url: result.url,
      public_id: result.public_id,
      mediaType: result.resource_type?.includes("video")
        ? "video"
        : "image",
      showInClient: req.body.showInClient === "true" || req.body.showInClient === true,
    });

    return res.status(201).json({
      success: true,
      data: media,
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   DELETE MEDIA
========================= */
export const deleteMedia = async (req, res) => {
  try {
    const media = await Gallery.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    await deleteFromCloudinary(media.public_id);
    await media.deleteOne();

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};