import express from "express";
import { searchSongsController, getSongDetailsController, getLatestSongsController } from "../controllers/songController.js";

const router = express.Router();

router.get("/latest", getLatestSongsController);
router.get("/details", getSongDetailsController);
router.get("/", searchSongsController);

export default router;
