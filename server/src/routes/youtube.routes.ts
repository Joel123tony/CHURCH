import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getLiveStatus } from "../controllers/youtube.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const youtubeRouter = Router();

youtubeRouter.get("/live", asyncHandler(getLiveStatus));
youtubeRouter.post("/live", requireAuth, requireRole("admin", "editor"), asyncHandler(getLiveStatus));

