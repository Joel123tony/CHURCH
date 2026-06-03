import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getSiteConfig, getHomePayload, globalSearch } from "../controllers/public.controller";
import { listPages, getPage } from "../controllers/pages.controller";
import { listPastors, getPastor } from "../controllers/pastors.controller";
import { listEvents } from "../controllers/events.controller";
import { listSermons, getSermon } from "../controllers/sermons.controller";

export const publicRouter = Router();

publicRouter.get("/site", asyncHandler(getSiteConfig));
publicRouter.get("/home", asyncHandler(getHomePayload));
publicRouter.get("/search", asyncHandler(globalSearch));
publicRouter.get("/pages", asyncHandler(listPages));
publicRouter.get("/pages/:slug", asyncHandler(getPage));
publicRouter.get("/pastors", asyncHandler(listPastors));
publicRouter.get("/pastors/:slug", asyncHandler(getPastor));
publicRouter.get("/events", asyncHandler(listEvents));
publicRouter.get("/sermons", asyncHandler(listSermons));
publicRouter.get("/sermons/:slug", asyncHandler(getSermon));
