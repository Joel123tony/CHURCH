import express from "express";
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
router.post("/", createPastor);

/* =========================
   UPDATE PASTOR
========================= */
router.put("/:id", updatePastor);

/* =========================
   DELETE PASTOR
========================= */
router.delete("/:id", deletePastor);

export default router;