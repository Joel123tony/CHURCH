import type { Request, Response } from "express";
import { Page } from "../models/Page";
import { touchContentVersion } from "../services/contentVersion";

export async function listPages(_req: Request, res: Response) {
  const items = await Page.find().sort({ createdAt: -1 }).lean();
  res.json(items);
}

export async function getPage(req: Request, res: Response) {
  const item = await Page.findOne({ slug: req.params.slug }).lean();
  if (!item) {
    return res.status(404).json({ message: "Page not found" });
  }
  res.json(item);
}

export async function createPage(req: Request, res: Response) {
  const item = await Page.create(req.body);
  await touchContentVersion();
  res.status(201).json(item);
}

export async function updatePage(req: Request, res: Response) {
  const item = await Page.findOneAndUpdate({ slug: req.params.slug }, req.body, { new: true });
  if (!item) {
    return res.status(404).json({ message: "Page not found" });
  }
  await touchContentVersion();
  res.json(item);
}

export async function deletePage(req: Request, res: Response) {
  const item = await Page.findOneAndDelete({ slug: req.params.slug });
  if (!item) {
    return res.status(404).json({ message: "Page not found" });
  }
  await touchContentVersion();
  res.status(204).send();
}
