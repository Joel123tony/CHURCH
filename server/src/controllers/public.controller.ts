import type { Request, Response } from "express";
import { SiteSettings } from "../models/SiteSettings";
import { Section } from "../models/Section";
import { Pastor } from "../models/Pastor";
import { Event } from "../models/Event";
import { Sermon } from "../models/Sermon";
import { detectLiveBroadcast } from "../services/youtube";

export async function getSiteConfig(_req: Request, res: Response) {
  const settings = await SiteSettings.findOne().lean();
  res.json(settings);
}

export async function getHomePayload(_req: Request, res: Response) {
  const [settings, sections, live, featuredSermons, pastors, events] = await Promise.all([
    SiteSettings.findOne().lean(),
    Section.find({ pageSlug: "home", published: true, hidden: false }).sort({ order: 1 }).lean(),
    detectLiveBroadcast(),
    Sermon.find({}).sort({ publishDate: -1 }).limit(6).lean(),
    Pastor.find({}).sort({ currentPastor: -1, startYear: -1 }).lean(),
    Event.find({ archived: false }).sort({ date: 1 }).limit(6).lean()
  ]);

  res.json({
    settings,
    sections,
    live,
    featuredSermons,
    pastors,
    events
  });
}

export async function globalSearch(req: Request, res: Response) {
  const query = String(req.query.q ?? "").trim();
  if (!query) {
    return res.json({ results: [] });
  }

  const regex = new RegExp(query, "i");
  const [sermons, events, pastors] = await Promise.all([
    Sermon.find({ $or: [{ title: regex }, { speaker: regex }, { tags: regex }] }).limit(10).lean(),
    Event.find({ $or: [{ title: regex }, { location: regex }] }).limit(10).lean(),
    Pastor.find({ $or: [{ name: regex }, { position: regex }, { biography: regex }] }).limit(10).lean()
  ]);

  res.json({
    results: [
      ...sermons.map((item) => ({ type: "sermon", item })),
      ...events.map((item) => ({ type: "event", item })),
      ...pastors.map((item) => ({ type: "pastor", item }))
    ]
  });
}

