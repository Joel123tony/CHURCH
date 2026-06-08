import express from "express";
import {
  createPastor,
  getAllPastors,
  updatePastor,
  deletePastor,
} from "../controllers/pastorController.js";


const router = express.Router();

/* =========================
   GET ALL PASTORS
========================= */
router.get("/", getAllPastors);

/* =========================
   CREATE PASTOR
========================= */
router.post("/", createPastor);

/* =========================
   UPDATE PASTOR
========================= */
router.put("/:id",  updatePastor);

/* =========================
   DELETE PASTOR
========================= */
router.delete("/:id",  deletePastor);

export default router;