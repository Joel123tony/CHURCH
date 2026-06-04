import type { Request, Response } from "express";
import { Section } from "../models/Section";
import { touchContentVersion } from "../services/contentVersion";

export async function listSections(req: Request, res: Response) {
  const pageSlug = String(req.query.pageSlug ?? "home");
  const items = await Section.find({ pageSlug }).sort({ order: 1 }).lean();
  res.json(items);
}

export async function createSection(req: Request, res: Response) {
  const section = await Section.create({
    hidden: false,
    published: true,
    alignment: "left",
    ...req.body
  });
  await touchContentVersion();
  res.status(201).json(section);
}

export async function updateSection(req: Request, res: Response) {
  const section = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!section) {
    return res.status(404).json({ message: "Section not found" });
  }
  await touchContentVersion();
  res.json(section);
}

export async function deleteSection(req: Request, res: Response) {
  const section = await Section.findByIdAndDelete(req.params.id);
  if (!section) {
    return res.status(404).json({ message: "Section not found" });
  }
  await touchContentVersion();
  res.status(204).send();
}

export async function duplicateSection(req: Request, res: Response) {
  const section = await Section.findById(req.params.id).lean();
  if (!section) {
    return res.status(404).json({ message: "Section not found" });
  }

  const { _id, createdAt, updatedAt, __v, ...rest } = section as typeof section & {
    _id: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
    __v?: unknown;
  };
  const copy = await Section.create({
    ...rest,
    key: `${section.key}-copy`,
    published: false,
    hidden: true,
    duplicatedFrom: String(section._id)
  });

  await touchContentVersion();
  res.status(201).json(copy);
}

export async function reorderSections(req: Request, res: Response) {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  await Promise.all(
    items.map((item: { id: string; order: number }) => Section.findByIdAndUpdate(item.id, { order: item.order }))
  );
  await touchContentVersion();
  res.json({ ok: true });
}

export async function publishSection(req: Request, res: Response) {
  const section = await Section.findByIdAndUpdate(req.params.id, { published: true, hidden: false }, { new: true });
  if (!section) {
    return res.status(404).json({ message: "Section not found" });
  }
  await touchContentVersion();
  res.json(section);
}

export async function hideSection(req: Request, res: Response) {
  const section = await Section.findByIdAndUpdate(req.params.id, { hidden: true }, { new: true });
  if (!section) {
    return res.status(404).json({ message: "Section not found" });
  }
  await touchContentVersion();
  res.json(section);
}
