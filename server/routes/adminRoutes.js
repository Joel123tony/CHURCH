import express from "express";
import Pastor from "../models/Pastor.js";
import Sermon from "../models/Sermon.js";
import Event from "../models/Event.js";
import Gallery from "../models/Gallery.js";
import PrayerRequest from "../models/PrayerRequest.js";

import upload from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

const router = express.Router();

/* ==================================================
   DASHBOARD
================================================== */
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

    res.status(200).json({
      success: true,

      user: {
        name: "Administrator",
      },

      counts: {
        pastors: pastorsCount,
        events: eventsCount,
        gallery: galleryCount,
        prayerRequests: prayerCount,
      },
    });
  } catch (err) {
    console.error("Dashboard Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ==================================================
   GET ALL PASTORS
================================================== */
router.get("/pastors", async (req, res) => {
  try {
    const pastors = await Pastor.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      pastors,
    });
  } catch (err) {
    console.error("Get Pastors Error:", err);

    res.status(500).json({
      success: false,
      pastors: [],
      message: err.message,
    });
  }
});

/* ==================================================
   CREATE PASTOR
================================================== */
router.post(
  "/pastors",
  upload.single("file"),
  async (req, res) => {
    try {
      let image = null;

      if (req.file) {
        const uploadResult =
          await uploadToCloudinary(req.file.buffer);

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
      console.error("Create Pastor Error:", err);

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

/* ==================================================
   UPDATE PASTOR
================================================== */
router.put(
  "/pastors/:id",
  upload.single("file"),
  async (req, res) => {
    try {
      const pastor = await Pastor.findById(
        req.params.id
      );

      if (!pastor) {
        return res.status(404).json({
          success: false,
          message: "Pastor not found",
        });
      }

      let image = pastor.image;

      if (req.file) {
        const uploadResult =
          await uploadToCloudinary(req.file.buffer);

        image = {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
          type: uploadResult.type,
        };
      }

      const updated = await Pastor.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          image,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      res.status(200).json({
        success: true,
        pastor: updated,
      });
    } catch (err) {
      console.error("Update Pastor Error:", err);

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

/* ==================================================
   DELETE PASTOR
================================================== */
router.delete("/pastors/:id", async (req, res) => {
  try {
    const pastor = await Pastor.findByIdAndDelete(
      req.params.id
    );

    if (!pastor) {
      return res.status(404).json({
        success: false,
        message: "Pastor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pastor deleted successfully",
    });
  } catch (err) {
    console.error("Delete Pastor Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ==================================================
   GET ALL SERMONS
================================================== */
router.get("/sermons", async (req, res) => {
  try {
    const sermons = await Sermon.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      sermons,
    });
  } catch (err) {
    console.error("Get Sermons Error:", err);

    res.status(500).json({
      success: false,
      sermons: [],
      message: err.message,
    });
  }
});

/* ==================================================
   CREATE SERMON
================================================== */
router.post("/sermons", async (req, res) => {
  try {
    const sermon = await Sermon.create(req.body);

    res.status(201).json({
      success: true,
      sermon,
    });
  } catch (err) {
    console.error("Create Sermon Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ==================================================
   DELETE SERMON
================================================== */
router.delete("/sermons/:id", async (req, res) => {
  try {
    const sermon = await Sermon.findByIdAndDelete(
      req.params.id
    );

    if (!sermon) {
      return res.status(404).json({
        success: false,
        message: "Sermon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sermon deleted successfully",
    });
  } catch (err) {
    console.error("Delete Sermon Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;