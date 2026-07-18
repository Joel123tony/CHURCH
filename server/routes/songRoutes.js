import express from "express";
import { searchSongsController, getSongDetailsController } from "../controllers/songController.js";

const router = express.Router();

router.get("/details", getSongDetailsController);
router.get("/", searchSongsController);

export default router;
