import type { Request, Response } from "express";
import { SiteSettings } from "../models/SiteSettings";
import { Section } from "../models/Section";
import { Pastor } from "../models/Pastor";
import { Event } from "../models/Event";
import { Sermon } from "../models/Sermon";
import { MediaAsset } from "../models/MediaAsset";
import { PrayerRequest } from "../models/PrayerRequest";
import { AnalyticsEvent } from "../models/AnalyticsEvent";

export async function dashboardSummary(_req: Request, res: Response) {
  const [visitors, pastors, sermons, events, videos, images] = await Promise.all([
    AnalyticsEvent.countDocuments({ type: "visit" }),
    Pastor.countDocuments(),
    Sermon.countDocuments(),
    Event.countDocuments({ archived: false }),
    MediaAsset.countDocuments({ type: "video" }),
    MediaAsset.countDocuments({ type: "image" })
  ]);

  res.json({ visitors, pastors, sermons, events, videos, images });
}

export async function listSections(req: Request, res: Response) {
  const pageSlug = String(req.query.pageSlug ?? "home");
  const sections = await Section.find({ pageSlug }).sort({ order: 1 }).lean();
  res.json(sections);
}

export async function upsertSettings(req: Request, res: Response) {
  const doc = await SiteSettings.findOneAndUpdate({}, req.body, { upsert: true, new: true });
  res.json(doc);
}

export async function listPrayerRequests(_req: Request, res: Response) {
  const items = await PrayerRequest.find().sort({ createdAt: -1 }).lean();
  res.json(items);
}

export async function listAnalytics(_req: Request, res: Response) {
  const items = await AnalyticsEvent.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json(items);
}

