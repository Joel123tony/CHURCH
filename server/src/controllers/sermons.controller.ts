import type { Request, Response } from "express";
import { Sermon } from "../models/Sermon";
import { slugify } from "../utils/slug";
import { touchContentVersion } from "../services/contentVersion";

export async function listSermons(req: Request, res: Response) {
  const featured = String(req.query.featured ?? "") === "true";
  const speaker = String(req.query.speaker ?? "").trim();
  const search = String(req.query.q ?? "").trim();
  const filter: Record<string, unknown> = {};

  if (featured) filter.featured = true;
  if (speaker) filter.speaker = new RegExp(speaker, "i");
  if (search) {
    filter.$or = [{ title: new RegExp(search, "i") }, { description: new RegExp(search, "i") }, { speaker: new RegExp(search, "i") }];
  }

  const items = await Sermon.find(filter).sort({ publishDate: -1 }).lean();
  res.json(items);
}

export async function getSermon(req: Request, res: Response) {
  const item = await Sermon.findOne({ slug: req.params.slug }).lean();
  if (!item) {
    return res.status(404).json({ message: "Sermon not found" });
  }
  res.json(item);
}

export async function createSermon(req: Request, res: Response) {
  const item = await Sermon.create({
    ...req.body,
    slug: req.body.slug ?? slugify(String(req.body.title ?? "sermon"))
  });
  await touchContentVersion();
  res.status(201).json(item);
}

export async function updateSermon(req: Request, res: Response) {
  const item = await Sermon.findOneAndUpdate({ youtubeVideoId: req.params.youtubeVideoId }, req.body, { new: true });
  if (!item) {
    return res.status(404).json({ message: "Sermon not found" });
  }
  await touchContentVersion();
  res.json(item);
}

export async function deleteSermon(req: Request, res: Response) {
  const item = await Sermon.findOneAndDelete({ youtubeVideoId: req.params.youtubeVideoId });
  if (!item) {
    return res.status(404).json({ message: "Sermon not found" });
  }
  await touchContentVersion();
  res.status(204).send();
}
