import express from "express";
import {
  getPublicPastors,
  searchPastors,
} from "../controllers/pastorController.js";

const router = express.Router();

/* =========================
   PUBLIC LIST (ACTIVE ONLY)
========================= */
router.get("/pastors", getPublicPastors);

/* =========================
   SEARCH (NAME + YEAR)
========================= */
router.get("/pastors/search", searchPastors);

export default router;