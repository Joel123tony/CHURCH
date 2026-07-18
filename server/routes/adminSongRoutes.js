import express from "express";
import { importUrlPreview, importSongSave, getImportStatus } from "../controllers/adminSongController.js";
import auth from "../middleware/auth.js"; 

const router = express.Router();

router.post("/import-url", auth, importUrlPreview);
router.post("/save", auth, importSongSave);
router.get("/status", auth, getImportStatus);

export default router;
