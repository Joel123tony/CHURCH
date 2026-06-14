import express from "express";

import {
  createPrayerRequest,
  getPrayerRequests,
  markAsPrayed,
  getPrayerCounts,
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
router.get(
  "/counts",
  getPrayerCounts
);
export default router;