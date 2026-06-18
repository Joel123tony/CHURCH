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
router.get("/", async (req, res) => {
  try {
    const data = await getAllPastors(req, res);
    return data;
  } catch (err) {
    console.error("GET ALL PASTORS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pastors",
    });
  }
});

/* =========================
   GET CURRENT PASTOR
========================= */
router.get("/current", async (req, res) => {
  try {
    const pastor = await Pastor.findOne({ isCurrent: true });

    return res.status(200).json({
      success: true,
      pastor,
    });
  } catch (err) {
    console.error("CURRENT PASTOR ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch current pastor",
    });
  }
});

/* =========================
   PUBLIC PASTORS
========================= */
router.get("/public", async (req, res) => {
  try {
    const data = await getPublicPastors(req, res);
    return data;
  } catch (err) {
    console.error("PUBLIC PASTORS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch public pastors",
    });
  }
});

/* =========================
   SEARCH PASTORS
========================= */
router.get("/search", async (req, res) => {
  try {
    const data = await searchPastors(req, res);
    return data;
  } catch (err) {
    console.error("SEARCH PASTORS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
});

/* =========================
   CREATE PASTOR
========================= */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    return await createPastor(req, res);
  } catch (err) {
    console.error("CREATE PASTOR ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create pastor",
    });
  }
});

/* =========================
   UPDATE PASTOR
========================= */
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    return await updatePastor(req, res);
  } catch (err) {
    console.error("UPDATE PASTOR ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update pastor",
    });
  }
});

/* =========================
   DELETE PASTOR
========================= */
router.delete("/:id", async (req, res) => {
  try {
    return await deletePastor(req, res);
  } catch (err) {
    console.error("DELETE PASTOR ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete pastor",
    });
  }
});

/* =========================
   SET CURRENT PASTOR
========================= */
router.put("/current/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await Pastor.updateMany({}, { $set: { isCurrent: false } });

    const pastor = await Pastor.findByIdAndUpdate(
      id,
      { $set: { isCurrent: true } },
      { new: true }
    );

    if (!pastor) {
      return res.status(404).json({
        success: false,
        message: "Pastor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Current pastor updated successfully",
      pastor,
    });
  } catch (err) {
    console.error("SET CURRENT PASTOR ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update current pastor",
    });
  }
});

export default router;