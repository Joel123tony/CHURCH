import type { Request, Response } from "express";
import { Event } from "../models/Event";
import { touchContentVersion } from "../services/contentVersion";

export async function listEvents(_req: Request, res: Response) {
  const items = await Event.find().sort({ date: 1 }).lean();
  res.json(items);
}

export async function createEvent(req: Request, res: Response) {
  const item = await Event.create(req.body);
  await touchContentVersion();
  res.status(201).json(item);
}

export async function updateEvent(req: Request, res: Response) {
  const item = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) {
    return res.status(404).json({ message: "Event not found" });
  }
  await touchContentVersion();
  res.json(item);
}

export async function archiveEvent(req: Request, res: Response) {
  const item = await Event.findByIdAndUpdate(req.params.id, { archived: true }, { new: true });
  if (!item) {
    return res.status(404).json({ message: "Event not found" });
  }
  await touchContentVersion();
  res.json(item);
}
