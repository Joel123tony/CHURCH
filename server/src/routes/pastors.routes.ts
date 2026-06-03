import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { createPastor, deletePastor, getPastor, listPastors, updatePastor } from "../controllers/pastors.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const pastorsRouter = Router();

pastorsRouter.get("/", asyncHandler(listPastors));
pastorsRouter.get("/:slug", asyncHandler(getPastor));
pastorsRouter.post("/", requireAuth, requireRole("admin", "editor"), asyncHandler(createPastor));
pastorsRouter.put("/:slug", requireAuth, requireRole("admin", "editor"), asyncHandler(updatePastor));
pastorsRouter.delete("/:slug", requireAuth, requireRole("admin"), asyncHandler(deletePastor));

