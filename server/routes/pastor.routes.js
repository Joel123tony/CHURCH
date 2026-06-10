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

export default router;