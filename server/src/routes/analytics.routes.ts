import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { trackEvent } from "../controllers/analytics.controller";
import { dashboardSummary, listAnalytics } from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const analyticsRouter = Router();

analyticsRouter.post("/track", asyncHandler(trackEvent));
analyticsRouter.get("/", requireAuth, requireRole("admin", "editor"), asyncHandler(listAnalytics));
analyticsRouter.get("/summary", requireAuth, requireRole("admin", "editor"), asyncHandler(dashboardSummary));

