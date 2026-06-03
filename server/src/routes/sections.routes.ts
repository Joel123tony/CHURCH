import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createSection,
  deleteSection,
  duplicateSection,
  hideSection,
  listSections,
  publishSection,
  reorderSections,
  updateSection
} from "../controllers/sections.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const sectionsRouter = Router();

sectionsRouter.get("/", asyncHandler(listSections));
sectionsRouter.post("/", requireAuth, requireRole("admin", "editor"), asyncHandler(createSection));
sectionsRouter.put("/reorder", requireAuth, requireRole("admin", "editor"), asyncHandler(reorderSections));
sectionsRouter.post("/:id/duplicate", requireAuth, requireRole("admin", "editor"), asyncHandler(duplicateSection));
sectionsRouter.post("/:id/publish", requireAuth, requireRole("admin", "editor"), asyncHandler(publishSection));
sectionsRouter.post("/:id/hide", requireAuth, requireRole("admin", "editor"), asyncHandler(hideSection));
sectionsRouter.put("/:id", requireAuth, requireRole("admin", "editor"), asyncHandler(updateSection));
sectionsRouter.delete("/:id", requireAuth, requireRole("admin", "editor"), asyncHandler(deleteSection));

