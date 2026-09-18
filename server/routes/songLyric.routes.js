import express from "express";
import uploadLyrics from "../middleware/uploadLyrics.js";
import {
  uploadSong,
  getSongs,
  getSongById,
  updateSong,
  deleteSong,
  downloadSongPPT,
  extractPreview,
  regenerateThanglish,
  generateTxtPPT
} from "../controllers/songLyricController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* =========================
   PUBLIC ROUTES
========================= */
router.get("/", getSongs);
router.get("/:id", getSongById);
router.get("/:id/download", downloadSongPPT);
router.get("/:id/generate-ppt", generateTxtPPT);

/* =========================
   ADMIN ROUTES
========================= */
router.post("/extract-preview", auth, uploadLyrics.single("file"), extractPreview);
router.post("/regenerate-thanglish", auth, regenerateThanglish);
router.post("/", auth, uploadLyrics.single("file"), uploadSong);
router.put("/:id", auth, uploadLyrics.single("file"), updateSong);
router.delete("/:id", auth, deleteSong);

export default router;
