import Pastor from "../models/Pastor.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

/* =========================
   CREATE PASTOR (WITH IMAGE)
========================= */
export const createPastor = async (req, res) => {
  try {
    let imageData = null;

    // if file uploaded (multer)
    if (req.file) {
      imageData = await uploadToCloudinary(req.file.buffer);
    }

    const pastor = await Pastor.create({
      ...req.body,
      image: imageData
        ? {
            url: imageData.url,
            public_id: imageData.public_id,
          }
        : null,
    });

    res.status(201).json({
      success: true,
      message: "Pastor created successfully",
      pastor,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error creating pastor",
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

    res.json({
      success: true,
      pastors,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching pastors",
      error: err.message,
      pastors: [],
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

    res.json({
      success: true,
      pastors,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching public pastors",
      error: err.message,
      pastors: [],
    });
  }
};

/* =========================
   SEARCH PASTORS
========================= */
export const searchPastors = async (req, res) => {
  try {
    const { name = "", year = "" } = req.query;

    const query = {};

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    if (year) {
      query.$or = [
        { joinedYear: Number(year) },
        { leftYear: Number(year) },
      ];
    }

    const pastors = await Pastor.find(query);

    res.json({
      success: true,
      pastors,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error searching pastors",
      error: err.message,
      pastors: [],
    });
  }
};

/* =========================
   UPDATE PASTOR (WITH IMAGE REPLACE)
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

    // if new image uploaded → delete old one
    if (req.file) {
      if (pastor.image?.public_id) {
        await deleteFromCloudinary(pastor.image.public_id);
      }

      const newImage = await uploadToCloudinary(req.file.buffer);

      req.body.image = {
        url: newImage.url,
        public_id: newImage.public_id,
      };
    }

    const updated = await Pastor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: "Pastor updated successfully",
      pastor: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating pastor",
      error: err.message,
    });
  }
};

/* =========================
   DELETE PASTOR (DELETE CLOUDINARY TOO)
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

    // delete image from cloudinary
    if (pastor.image?.public_id) {
      await deleteFromCloudinary(pastor.image.public_id);
    }

    await pastor.deleteOne();

    res.json({
      success: true,
      message: "Pastor deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error deleting pastor",
      error: err.message,
    });
  }
};