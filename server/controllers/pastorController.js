import Pastor from "../models/Pastor.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

/* =========================
  CREATE PASTOR
========================= */
export const createPastor = async (req, res) => {
  try {
    let image = {
      url: "",
      public_id: "",
    };

    if (req.body.image) {
      image = req.body.image;
    }

    if (req.file && req.file.buffer) {
      try {
        const upload = await uploadToCloudinary(req.file.buffer);

        image = {
          url: upload?.url || upload?.secure_url || "",
          public_id: upload?.public_id || "",
        };
      } catch (uploadErr) {
        console.error("Cloudinary Upload Error:", uploadErr);
      }
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
      message: "Failed to create pastor",
      error: err.message,
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
    console.error("GET ALL PASTORS ERROR:", err);

    return res.status(500).json({
      success: false,
      pastors: [],
      message: "Failed to fetch pastors",
    });
  }
};

/* =========================
  PUBLIC PASTORS
========================= */
export const getPublicPastors = async (req, res) => {
  try {
    const pastors = await Pastor.find().sort({ joinedYear: -1 });

    return res.json({
      success: true,
      pastors,
    });
  } catch (err) {
    console.error("PUBLIC PASTORS ERROR:", err);

    return res.status(500).json({
      success: false,
      pastors: [],
      message: "Failed to fetch public pastors",
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
    console.error("SEARCH ERROR:", err);

    return res.status(500).json({
      success: false,
      pastors: [],
      message: "Search failed",
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
      try {
        if (pastor.image?.public_id) {
          await deleteFromCloudinary(pastor.image.public_id);
        }

        const upload = await uploadToCloudinary(req.file.buffer);

        updatedImage = {
          url: upload?.url || upload?.secure_url || "",
          public_id: upload?.public_id || "",
        };
      } catch (uploadErr) {
        console.error("Cloudinary Update Error:", uploadErr);
      }
    }

    const updated = await Pastor.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        image: updatedImage,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.json({
      success: true,
      pastor: updated,
    });
  } catch (err) {
    console.error("UPDATE PASTOR ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update pastor",
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

    try {
      if (pastor.image?.public_id) {
        await deleteFromCloudinary(pastor.image.public_id);
      }
    } catch (deleteErr) {
      console.error("Cloudinary Delete Error:", deleteErr);
    }

    await Pastor.deleteOne({ _id: req.params.id });

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    console.error("DELETE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete pastor",
    });
  }
};