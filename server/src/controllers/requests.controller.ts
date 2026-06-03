import type { Request, Response } from "express";
import { PrayerRequest } from "../models/PrayerRequest";

export async function createPrayerRequest(req: Request, res: Response) {
  const item = await PrayerRequest.create(req.body);
  res.status(201).json(item);
}

export async function listPrayerRequests(_req: Request, res: Response) {
  const items = await PrayerRequest.find().sort({ createdAt: -1 }).lean();
  res.json(items);
}

export async function updatePrayerRequest(req: Request, res: Response) {
  const item = await PrayerRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) {
    return res.status(404).json({ message: "Prayer request not found" });
  }
  res.json(item);
}

