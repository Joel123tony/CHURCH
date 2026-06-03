import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "../services/tokens";
import { env } from "../config/env";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/"
};

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const payload = { sub: String(user._id), role: user.role, email: user.email };
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.json({
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, name: user.name, role: user.role }
  });
}

export async function refresh(req: Request, res: Response) {
  const token = (req.body?.refreshToken as string | undefined) ?? (req.cookies?.refreshToken as string | undefined);
  if (!token) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  const payload = verifyRefreshToken(token);
  const accessToken = createAccessToken(payload);
  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.json({ accessToken });
}

export async function me(req: Request, res: Response) {
  res.json({ user: req.user ?? null });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  res.json({ ok: true });
}
