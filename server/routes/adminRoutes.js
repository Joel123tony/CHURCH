import express from "express";
import Pastor from "../models/Pastor.js";
import Sermon from "../models/Sermon.js";
import Event from "../models/Event.js";
import Gallery from "../models/Gallery.js";
import PrayerRequest from "../models/PrayerRequest.js";
import Book from "../models/Book.js";
import ContentBlock from "../models/ContentBlock.js";

import upload from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import auth from "../middleware/auth.js";

const router = express.Router();

/* ==================================================
   DASHBOARD
================================================== */
router.get("/dashboard", auth, async (req, res) => {
  try {
    const [
      pastorsCount,
      eventsCount,
      galleryCount,
      prayerCount,
      booksCount,
      pastorMessagesBlock
    ] = await Promise.all([
      Pastor.countDocuments(),
      Event.countDocuments(),
      Gallery.countDocuments(),
      PrayerRequest.countDocuments({
        status: "pending",
      }),
      Book.countDocuments(),
      ContentBlock.findOne({ identifier: "pastor-messages" })
    ]);

    const pastorMessagesCount = pastorMessagesBlock?.data?.messages?.length || 0;

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
        books: booksCount,
        pastorMessages: pastorMessagesCount,
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
router.get("/pastors", auth, async (req, res) => {
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
  auth,
  upload.single("file"),
  async (req, res) => {
    try {
      let image = null;

      if (req.file) {
        const uploadResult = await uploadToCloudinary(req.file.path, {
          folder: "mtc-padikuppam/pastors/profile-images",
          resource_type: "image"
        });

        image = {
          url: uploadResult.url || uploadResult.optimized_url,
          public_id: uploadResult.public_id,
          type: uploadResult.resource_type || uploadResult.type,
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
    } finally {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e) { console.error(e); }
      }
    }
  }
);

/* ==================================================
   UPDATE PASTOR
================================================== */
router.put(
  "/pastors/:id",
  auth,
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
        const uploadResult = await uploadToCloudinary(req.file.path, {
          folder: "mtc-padikuppam/pastors/profile-images",
          resource_type: "image"
        });

        image = {
          url: uploadResult.url || uploadResult.optimized_url,
          public_id: uploadResult.public_id,
          type: uploadResult.resource_type || uploadResult.type,
        };
      }

      const updated = await Pastor.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          image,
        },
        {
          returnDocument: 'after',
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
    } finally {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e) { console.error(e); }
      }
    }
  }
);

/* ==================================================
   DELETE PASTOR
================================================== */
router.delete("/pastors/:id", auth, async (req, res) => {
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
router.get("/sermons", auth, async (req, res) => {
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
router.post("/sermons", auth, async (req, res) => {
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
router.delete("/sermons/:id", auth, async (req, res) => {
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

/* ==================================================
   MANUAL SONG IMPORT (BACKGROUND WORKER)
================================================== */
router.post("/songs/import", auth, (req, res) => {
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "fetchLatestTamilSongs.js");
    
    // Spawn in detached background mode to prevent blocking API
    const child = spawn("node", [scriptPath], {
      detached: true,
      stdio: "ignore" // We don't need to capture stdout/stderr in the HTTP response
    });
    
    child.on("error", (err) => {
      console.error("Failed to start background song import process:", err);
    });
    
    child.unref(); // Allow the parent event loop to exit independently of the child

    return res.status(202).json({
      success: true,
      message: "Song import started in the background. Check server logs for progress."
    });
  } catch (err) {
    console.error("Song Import Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

export default router;