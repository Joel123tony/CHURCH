import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler";
import { createMedia, deleteMedia, listMedia, uploadMedia } from "../controllers/media.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const upload = multer({ storage: multer.memoryStorage() });

export const mediaRouter = Router();

mediaRouter.get("/", requireAuth, requireRole("admin", "editor"), asyncHandler(listMedia));
mediaRouter.post("/", requireAuth, requireRole("admin", "editor"), asyncHandler(createMedia));
mediaRouter.post("/upload", requireAuth, requireRole("admin", "editor"), upload.single("file"), asyncHandler(uploadMedia));
mediaRouter.delete("/:id", requireAuth, requireRole("admin", "editor"), asyncHandler(deleteMedia));

