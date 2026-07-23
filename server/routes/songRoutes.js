import express from "express";
import { searchSongsController, getSongDetailsController, getLatestSongsController } from "../controllers/songController.js";
import auth from "../middleware/auth.js";
import Song from "../models/Song.js";
import { prepareSongForClient } from "../utils/songNormalization.js";

const router = express.Router();

router.get("/latest", getLatestSongsController);
router.get("/details", getSongDetailsController);
router.get("/search", searchSongsController);
router.get("/stats", async (req, res) => {
  try {
    const [totalSongs, completed, failed, recovering, aiProcessed, aiFailed] = await Promise.all([
      Song.countDocuments({ isPublished: true }),
      Song.countDocuments({ status: "completed", isPublished: true }),
      Song.countDocuments({ status: "failed" }),
      Song.countDocuments({ status: "recovering" }),
      Song.countDocuments({ aiStatus: { $in: ["processed", "fallback"] } }),
      Song.countDocuments({ aiStatus: "failed" })
    ]);

    return res.json({
      success: true,
      stats: {
        totalSongs,
        completed,
        failed,
        recovering,
        aiProcessed,
        aiFailed
      }
    });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load song stats" });
  }
});
router.get("/admin", auth, async (req, res) => {
  try {
    const songs = await Song.find({}).sort({ createdAt: -1 }).limit(50).lean();
    return res.json({
      success: true,
      songs: songs.map((song) => prepareSongForClient(song))
    });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load admin songs" });
  }
});
router.get("/", searchSongsController);
router.get("/:slug", getSongDetailsController);

export default router;
