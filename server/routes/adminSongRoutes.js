import express from "express";
import { importUrlPreview, importSongSave, getImportStatus, getDashboardData, startLibraryScan, getScanStatus, getFailedImports, deleteFailedImport, getRecentImports, retryAllFailed, retrySelectedFailed, getRetryStatus, getWorkerStatus, getPlatformHealth, getModerationQueue, moderateSong, getProviderRegistry, approveProviderRegistry, rejectProviderRegistry, runProviderDiscovery, refreshKnowledgeGraph, refreshSongGraph, createSystemBackup, getSongDebug } from "../controllers/adminSongController.js";
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
router.get("/workers/status", auth, getWorkerStatus);
router.get("/health", auth, getPlatformHealth);
router.get("/review-queue", auth, getModerationQueue);
router.post("/review/:id", auth, moderateSong);
router.get("/providers", auth, getProviderRegistry);
router.post("/providers/discover", auth, runProviderDiscovery);
router.post("/providers/:id/approve", auth, approveProviderRegistry);
router.post("/providers/:id/reject", auth, rejectProviderRegistry);
router.post("/graph/refresh", auth, refreshKnowledgeGraph);
router.post("/graph/:id", auth, refreshSongGraph);
router.post("/backup", auth, createSystemBackup);
router.get("/song-debug/:id", auth, getSongDebug);

export default router;
