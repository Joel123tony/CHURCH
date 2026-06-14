import express from "express";

import {
  createPrayerRequest,
  getPrayerRequests,
  markAsPrayed,
} from "../controllers/prayerRequestController.js";

const router = express.Router();

/* CREATE */
router.post("/", createPrayerRequest);

/* GET */
router.get("/", getPrayerRequests);

/* MARK PRAYED */
router.patch(
  "/:id/prayed",
  markAsPrayed
);

export default router;