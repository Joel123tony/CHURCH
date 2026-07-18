import express from "express";
import { importUrlPreview, importSongSave, getImportStatus } from "../controllers/adminSongController.js";
import { requireAdmin } from "../middleware/auth.js"; // Assuming auth middleware exists

const router = express.Router();

router.post("/import-url", importUrlPreview);
router.post("/save", importSongSave);
router.get("/status", getImportStatus);

export default router;
