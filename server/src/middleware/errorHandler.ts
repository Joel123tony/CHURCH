import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(statusCode).json({ message });
};

