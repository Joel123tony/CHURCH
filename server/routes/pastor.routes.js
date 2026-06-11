import express from "express";
import upload from "../middleware/upload.js";
import Pastor from "../models/Pastor.js";

import {
  createPastor,
  getAllPastors,
  getPublicPastors,
  searchPastors,
  updatePastor,
  deletePastor,
} from "../controllers/pastorController.js";

const router = express.Router();

/* =========================
   GET ALL PASTORS (ADMIN)
========================= */
router.get("/", getAllPastors);

/* =========================
   GET CURRENT PASTOR
========================= */
router.get("/current", async (req, res) => {
  try {
    const pastor = await Pastor.findOne({ isCurrent: true });

    return res.json({
      success: true,
      pastor,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================
   PUBLIC PASTORS
========================= */
router.get("/public", getPublicPastors);

/* =========================
   SEARCH PASTORS
========================= */
router.get("/search", searchPastors);

/* =========================
   CREATE PASTOR
========================= */
router.post(
  "/",
  upload.single("file"),
  createPastor
);

/* =========================
   UPDATE PASTOR
========================= */
router.put(
  "/:id",
  upload.single("file"),
  updatePastor
);

/* =========================
   DELETE PASTOR
========================= */
router.delete("/:id", deletePastor);

/* =========================
   SET CURRENT PASTOR
========================= */
router.put("/current/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Remove current flag from all pastors
    await Pastor.updateMany(
      {},
      { $set: { isCurrent: false } }
    );

    // Set selected pastor as current
    const pastor = await Pastor.findByIdAndUpdate(
      id,
      {
        $set: {
          isCurrent: true,
        },
      },
      {
        new: true,
      }
    );

    if (!pastor) {
      return res.status(404).json({
        success: false,
        message: "Pastor not found",
      });
    }

    return res.json({
      success: true,
      message: "Current pastor updated successfully",
      pastor,
    });
  } catch (err) {
    console.error("SET CURRENT PASTOR ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;