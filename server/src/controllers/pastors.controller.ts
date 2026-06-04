import type { Request, Response } from "express";
import { Pastor } from "../models/Pastor";
import { fetchPlaylistSermons } from "../services/youtube";
import { touchContentVersion } from "../services/contentVersion";

export async function listPastors(_req: Request, res: Response) {
  const items = await Pastor.find().sort({ currentPastor: -1, startYear: -1 }).lean();
  res.json(items);
}

export async function getPastor(req: Request, res: Response) {
  const item = await Pastor.findOne({ slug: req.params.slug }).lean();
  if (!item) {
    return res.status(404).json({ message: "Pastor not found" });
  }
  const sermons = await fetchPlaylistSermons(item.youtubePlaylistId ?? undefined);
  res.json({ pastor: item, sermons });
}

export async function createPastor(req: Request, res: Response) {
  const item = await Pastor.create(req.body);
  await touchContentVersion();
  res.status(201).json(item);
}

export async function updatePastor(req: Request, res: Response) {
  const item = await Pastor.findOneAndUpdate({ slug: req.params.slug }, req.body, { new: true });
  if (!item) {
    return res.status(404).json({ message: "Pastor not found" });
  }
  await touchContentVersion();
  res.json(item);
}

export async function deletePastor(req: Request, res: Response) {
  const item = await Pastor.findOneAndDelete({ slug: req.params.slug });
  if (!item) {
    return res.status(404).json({ message: "Pastor not found" });
  }
  await touchContentVersion();
  res.status(204).send();
}
