import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { createPage, deletePage, getPage, listPages, updatePage } from "../controllers/pages.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const pagesRouter = Router();

pagesRouter.get("/", asyncHandler(listPages));
pagesRouter.get("/:slug", asyncHandler(getPage));
pagesRouter.post("/", requireAuth, requireRole("admin"), asyncHandler(createPage));
pagesRouter.put("/:slug", requireAuth, requireRole("admin"), asyncHandler(updatePage));
pagesRouter.delete("/:slug", requireAuth, requireRole("admin"), asyncHandler(deletePage));

