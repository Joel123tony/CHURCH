import express from "express";
import upload from "../middleware/upload.js";

import {
  uploadMedia,
  getAllMedia,
  getClientMedia,
  updateMedia,
  deleteMedia,
  bulkDeleteMedia,
  toggleClientGallery,
} from "../controllers/galleryController.js";

const router = express.Router();

/* =========================
   TOGGLE HOMEPAGE GALLERY
========================= */
router.patch(
  "/toggle-client/:id",
  toggleClientGallery
);

/* =========================
   CREATE MEDIA
========================= */
router.post(
  "/",
  upload.single("file"),
  uploadMedia
);

/* =========================
   ADMIN GALLERY
========================= */
router.get(
  "/",
  getAllMedia
);

/* =========================
   CLIENT HOMEPAGE GALLERY
========================= */
router.get(
  "/client",
  getClientMedia
);

/* =========================
   UPDATE MEDIA
========================= */
router.put(
  "/:id",
  updateMedia
);

/* =========================
   DELETE MEDIA
========================= */
router.delete(
  "/bulk",
  bulkDeleteMedia
);

router.delete(
  "/:id",
  deleteMedia
);

export default router;
