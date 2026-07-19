import express from "express";
import { importUrlPreview, importSongSave, getImportStatus, getDashboardData, startLibraryScan, getScanStatus, getFailedImports, deleteFailedImport, getRecentImports, retryAllFailed, retrySelectedFailed, getRetryStatus } from "../controllers/adminSongController.js";
import auth from "../middleware/auth.js"; 

const router = express.Router();

router.post("/import-url", auth, importUrlPreview);
router.post("/save", auth, importSongSave);
router.get("/status", auth, getImportStatus);
router.get("/dashboard", auth, getDashboardData);
router.post("/scan/start", auth, startLibraryScan);
router.get("/scan/status", auth, getScanStatus);
router.get("/failed", auth, getFailedImports);
router.delete("/failed/:id", auth, deleteFailedImport);
router.get("/recent", auth, getRecentImports);
router.post("/retry-all", auth, retryAllFailed);
router.post("/retry-selected", auth, retrySelectedFailed);
router.get("/retry/status", auth, getRetryStatus);

export default router;
