import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { createPrayerRequest, listPrayerRequests, updatePrayerRequest } from "../controllers/requests.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const requestsRouter = Router();

requestsRouter.post("/", asyncHandler(createPrayerRequest));
requestsRouter.get("/", requireAuth, requireRole("admin", "editor"), asyncHandler(listPrayerRequests));
requestsRouter.put("/:id", requireAuth, requireRole("admin", "editor"), asyncHandler(updatePrayerRequest));

