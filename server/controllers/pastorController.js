import Pastor from "../models/Pastor.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

/* =========================
   CREATE PASTOR
========================= */
export const createPastor = async (req, res) => {
  try {
    let image = null;

    if (req.file) {
      const upload = await uploadToCloudinary(req.file.buffer);

      image = {
        url: upload.secure_url || upload.url,
        public_id: upload.public_id,
      };
    }

    const pastor = await Pastor.create({
      ...req.body,
      image,
    });

    res.status(201).json({
      success: true,
      pastor,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   GET ALL
========================= */
export const getAllPastors = async (req, res) => {
  try {
    const pastors = await Pastor.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      pastors,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      pastors: [],
      message: err.message,
    });
  }
};

/* =========================
   UPDATE PASTOR
========================= */
export const updatePastor = async (req, res) => {
  try {
    const pastor = await Pastor.findById(req.params.id);

    if (!pastor) {
      return res.status(404).json({
        success: false,
        message: "Pastor not found",
      });
    }

    let updatedImage = pastor.image;

    if (req.file) {
      if (pastor.image?.public_id) {
        await deleteFromCloudinary(pastor.image.public_id);
      }

      const upload = await uploadToCloudinary(req.file.buffer);

      updatedImage = {
        url: upload.secure_url || upload.url,
        public_id: upload.public_id,
      };
    }

    const updated = await Pastor.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        image: updatedImage,
      },
      { new: true }
    );

    res.json({
      success: true,
      pastor: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   DELETE PASTOR
========================= */
export const deletePastor = async (req, res) => {
  try {
    const pastor = await Pastor.findById(req.params.id);

    if (!pastor) {
      return res.status(404).json({
        success: false,
        message: "Pastor not found",
      });
    }

    if (pastor.image?.public_id) {
      await deleteFromCloudinary(pastor.image.public_id);
    }

    await Pastor.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};