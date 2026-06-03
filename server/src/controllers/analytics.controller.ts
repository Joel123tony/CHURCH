import type { Request, Response } from "express";
import { AnalyticsEvent } from "../models/AnalyticsEvent";

export async function trackEvent(req: Request, res: Response) {
  const item = await AnalyticsEvent.create(req.body);
  res.status(201).json(item);
}

