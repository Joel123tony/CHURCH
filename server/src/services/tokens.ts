import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthUser } from "../middleware/auth";

export function createAccessToken(user: AuthUser) {
  return jwt.sign(user, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });
}

export function createRefreshToken(user: AuthUser) {
  return jwt.sign(user, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthUser;
}

