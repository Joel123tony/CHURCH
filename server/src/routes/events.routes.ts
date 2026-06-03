import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { archiveEvent, createEvent, listEvents, updateEvent } from "../controllers/events.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const eventsRouter = Router();

eventsRouter.get("/", asyncHandler(listEvents));
eventsRouter.post("/", requireAuth, requireRole("admin", "editor"), asyncHandler(createEvent));
eventsRouter.put("/:id", requireAuth, requireRole("admin", "editor"), asyncHandler(updateEvent));
eventsRouter.post("/:id/archive", requireAuth, requireRole("admin"), asyncHandler(archiveEvent));

