import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { createSermon, deleteSermon, listSermons, updateSermon } from "../controllers/sermons.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const sermonsRouter = Router();

sermonsRouter.get("/", asyncHandler(listSermons));
sermonsRouter.post("/", requireAuth, requireRole("admin", "editor"), asyncHandler(createSermon));
sermonsRouter.put("/:youtubeVideoId", requireAuth, requireRole("admin", "editor"), asyncHandler(updateSermon));
sermonsRouter.delete("/:youtubeVideoId", requireAuth, requireRole("admin"), asyncHandler(deleteSermon));

