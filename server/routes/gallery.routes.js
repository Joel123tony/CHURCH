import express from "express";
import upload from "../middleware/upload.js";

import {
  uploadMedia,
  getAllMedia,
  getClientMedia,
  updateMedia,
  deleteMedia,
} from "../controllers/galleryController.js";

const router = express.Router();

router.post("/", upload.single("file"), uploadMedia);

router.get("/", getAllMedia);
router.get("/client", getClientMedia);

router.put("/:id", updateMedia);
router.delete("/:id", deleteMedia);

export default router;