import express from "express";
import upload from "../middleware/upload.js";

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
    await Pastor.updateMany({}, {
      isCurrent: false,
    });

    const pastor = await Pastor.findByIdAndUpdate(
      req.params.id,
      {
        isCurrent: true,
      },
      { new: true }
    );

    res.json(pastor);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

/* =========================
   GET CURRENT PASTOR
========================= */
router.get("/current", async (req, res) => {
  try {
    const pastor = await Pastor.findOne({
      isCurrent: true,
    });

    res.json(pastor);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

export default router;