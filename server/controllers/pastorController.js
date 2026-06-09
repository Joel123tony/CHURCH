import Pastor from "../models/Pastor.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

/* =========================
   CREATE PASTOR
========================= */
export const createPastor = async (req, res) => {
  try {
    let image = null;

    if (req.file && req.file.buffer) {
      const upload = await uploadToCloudinary(req.file.buffer);

      image = {
        url: upload.url || upload.secure_url, // 🔥 SAFE FIX
        public_id: upload.public_id,
      };
    }

    const pastor = await Pastor.create({
      ...req.body,
      image,
    });

    return res.status(201).json({
      success: true,
      pastor,
    });

  } catch (err) {
    console.error("CREATE PASTOR ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Create pastor failed",
    });
  }
};

/* =========================
   GET ALL PASTORS
========================= */
export const getAllPastors = async (req, res) => {
  try {
    const pastors = await Pastor.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      pastors,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      pastors: [],
      message: err.message,
    });
  }
};

/* =========================
   PUBLIC PASTORS
========================= */
export const getPublicPastors = async (req, res) => {
  try {
    const pastors = await Pastor.find({ active: true }).sort({
      joinedYear: -1,
    });

    return res.json({
      success: true,
      pastors,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      pastors: [],
      message: err.message,
    });
  }
};

/* =========================
   SEARCH PASTORS
========================= */
export const searchPastors = async (req, res) => {
  try {
    const { name = "" } = req.query;

    const pastors = await Pastor.find({
      name: { $regex: name, $options: "i" },
    });

    return res.json({
      success: true,
      pastors,
    });

  } catch (err) {
    return res.status(500).json({
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

    if (req.file && req.file.buffer) {
      if (pastor.image?.public_id) {
        await deleteFromCloudinary(pastor.image.public_id);
      }

      const upload = await uploadToCloudinary(req.file.buffer);

      updatedImage = {
        url: upload.url || upload.secure_url,
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

    return res.json({
      success: true,
      pastor: updated,
    });

  } catch (err) {
    console.error("UPDATE PASTOR ERROR:", err);

    return res.status(500).json({
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

    return res.json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};