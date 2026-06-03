import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { login, refresh, me, logout } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(login));
authRouter.post("/refresh", asyncHandler(refresh));
authRouter.get("/me", requireAuth, asyncHandler(me));
authRouter.post("/logout", asyncHandler(logout));
