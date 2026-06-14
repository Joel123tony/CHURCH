import express from "express";
import Pastor from "../models/Pastor.js";
import Sermon from "../models/Sermon.js";
import upload from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import Event from "../models/Event.js";
import Gallery from "../models/Gallery.js";
import PrayerRequest from "../models/PrayerRequest.js";

const router = express.Router();

/* =========================
   DASHBOARD STATS
========================= */
router.get("/dashboard", async (req, res) => {
  try {
    const [
      pastorsCount,
      eventsCount,
      galleryCount,
      prayerCount,
    ] = await Promise.all([
      Pastor.countDocuments(),
      Event.countDocuments(),
      Gallery.countDocuments(),
      PrayerRequest.countDocuments({
        status: "pending",
      }),
    ]);

    res.json({
      success: true,
      counts: {
        pastors: pastorsCount,
        events: eventsCount,
        gallery: galleryCount,
        prayerRequests: prayerCount,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================
   GET ALL PASTORS (ADMIN)
========================= */
router.get("/pastors", async (req, res) => {
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
});

/* =========================
   CREATE PASTOR (WITH UPLOAD)
   🔥 FIX: multer added here
========================= */
router.post("/pastors", upload.single("file"), async (req, res) => {
  try {
    let image = null;

    // upload file to cloudinary if exists
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);

      image = {
        url: uploadResult.url,
        public_id: uploadResult.public_id,
        type: uploadResult.type,
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
});

/* =========================
   UPDATE PASTOR
========================= */
router.put("/pastors/:id", upload.single("file"), async (req, res) => {
  try {
    const pastor = await Pastor.findById(req.params.id);

    if (!pastor) {
      return res.status(404).json({
        success: false,
        message: "Pastor not found",
      });
    }

    let image = pastor.image;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);

      image = {
        url: uploadResult.url,
        public_id: uploadResult.public_id,
        type: uploadResult.type,
      };
    }

    const updated = await Pastor.findByIdAndUpdate(
      req.params.id,
      { ...req.body, image },
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
});

/* =========================
   DELETE PASTOR
========================= */
router.delete("/pastors/:id", async (req, res) => {
  try {
    await Pastor.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Pastor deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================
   SERMONS (BASIC CRUD)
========================= */
router.get("/sermons", async (req, res) => {
  try {
    const sermons = await Sermon.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      sermons,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      sermons: [],
      message: err.message,
    });
  }
});

router.post("/sermons", async (req, res) => {
  try {
    const sermon = await Sermon.create(req.body);

    res.status(201).json({
      success: true,
      sermon,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.delete("/sermons/:id", async (req, res) => {
  try {
    await Sermon.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Sermon deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;