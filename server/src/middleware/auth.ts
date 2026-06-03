import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type AuthUser = {
  sub: string;
  role: "admin" | "editor";
  email: string;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const cookieToken = req.cookies?.accessToken as string | undefined;
  const resolvedToken = token ?? cookieToken;

  if (!resolvedToken) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  try {
    const payload = jwt.verify(resolvedToken, env.JWT_ACCESS_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

export function requireRole(...roles: Array<AuthUser["role"]>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
    }
    next();
  };
}
