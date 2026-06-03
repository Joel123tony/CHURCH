import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { dashboardSummary, upsertSettings } from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { listSections } from "../controllers/sections.controller";
import { listPrayerRequests } from "../controllers/requests.controller";
import { listAnalytics } from "../controllers/admin.controller";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin", "editor"));

adminRouter.get("/dashboard", asyncHandler(dashboardSummary));
adminRouter.get("/sections", asyncHandler(listSections));
adminRouter.put("/settings", asyncHandler(upsertSettings));
adminRouter.get("/prayer-requests", asyncHandler(listPrayerRequests));
adminRouter.get("/analytics", asyncHandler(listAnalytics));
