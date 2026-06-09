import Gallery from "../models/Gallery.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

/* =========================
   UPLOAD MEDIA
========================= */
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    const media = await Gallery.create({
      title: req.body.title,
      url: result.url,
      public_id: result.public_id,
      mediaType: result.resource_type === "video" ? "video" : "image",
      showInClient: req.body.showInClient === "true",
    });

    res.status(201).json({
      success: true,
      media,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* =========================
   GET ALL (ADMIN)
========================= */
export const getAllMedia = async (req, res) => {
  const media = await Gallery.find().sort({ createdAt: -1 });

  res.json({ success: true, media });
};

/* =========================
   GET CLIENT MEDIA ONLY
========================= */
export const getClientMedia = async (req, res) => {
  const media = await Gallery.find({ showInClient: true }).sort({
    createdAt: -1,
  });

  res.json({ success: true, media });
};

/* =========================
   UPDATE MEDIA
========================= */
export const updateMedia = async (req, res) => {
  try {
    const media = await Gallery.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ message: "Not found" });
    }

    media.title = req.body.title ?? media.title;
    media.showInClient = req.body.showInClient ?? media.showInClient;

    await media.save();

    res.json({ success: true, media });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   DELETE MEDIA
========================= */
export const deleteMedia = async (req, res) => {
  try {
    const media = await Gallery.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ message: "Not found" });
    }

    await deleteFromCloudinary(media.public_id);

    await media.deleteOne();

    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};