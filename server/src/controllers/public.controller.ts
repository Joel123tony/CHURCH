import type { Request, Response } from "express";
import { Page } from "../models/Page";
import { SiteSettings } from "../models/SiteSettings";
import { Section } from "../models/Section";
import { Pastor } from "../models/Pastor";
import { Event } from "../models/Event";
import { Sermon } from "../models/Sermon";
import { MediaAsset } from "../models/MediaAsset";
import { detectLiveBroadcast, fetchRecentBroadcasts } from "../services/youtube";

export async function getSiteConfig(_req: Request, res: Response) {
  const settings = await SiteSettings.findOne().lean();
  res.json(settings);
}

export async function getHomePayload(_req: Request, res: Response) {
  const [settings, sections, live, youtubeVideos, featuredSermons, pastors, events] = await Promise.all([
    SiteSettings.findOne().lean(),
    Section.find({ pageSlug: "home", published: true, hidden: false, key: { $nin: ["mission", "vision", "search"] } })
      .sort({ order: 1 })
      .lean(),
    detectLiveBroadcast(),
    fetchRecentBroadcasts(),
    Sermon.find({}).sort({ publishDate: -1 }).limit(6).lean(),
    Pastor.find({}).sort({ currentPastor: -1, startYear: -1 }).lean(),
    Event.find({ archived: false }).sort({ date: 1 }).limit(6).lean()
  ]);

  res.json({
    settings,
    sections,
    live,
    youtubeVideos,
    featuredSermons,
    pastors,
    events
  });
}

export async function globalSearch(req: Request, res: Response) {
  const query = String(req.query.q ?? "").trim();
  if (!query) {
    return res.json({
      query,
      groups: {
        pages: [],
        events: [],
        pastors: [],
        sermons: [],
        ministries: [],
        media: []
      },
      results: []
    });
  }

  const limit = Math.min(Math.max(Number(req.query.limit ?? 8) || 8, 1), 20);
  const regex = new RegExp(query, "i");
  const [pages, sections, sermons, events, pastors, media] = await Promise.all([
    Page.find({ $or: [{ slug: regex }, { title: regex }, { subtitle: regex }, { description: regex }] }).limit(20).lean(),
    Section.find({
      $or: [{ key: regex }, { title: regex }, { subtitle: regex }, { description: regex }, { richText: regex }, { pageSlug: regex }]
    })
      .limit(20)
      .lean(),
    Sermon.find({ $or: [{ title: regex }, { description: regex }, { speaker: regex }, { tags: regex }] }).limit(20).lean(),
    Event.find({ $or: [{ title: regex }, { location: regex }, { description: regex }] }).limit(20).lean(),
    Pastor.find({ $or: [{ name: regex }, { position: regex }, { biography: regex }] }).limit(20).lean(),
    MediaAsset.find({ $or: [{ url: regex }, { publicId: regex }, { type: regex }] }).limit(20).lean()
  ]);

  const toScore = (value: string | undefined, priority = 1) => {
    if (!value) return 0;
    const text = value.toLowerCase();
    const term = query.toLowerCase();
    if (text === term) return 100 * priority;
    if (text.startsWith(term)) return 80 * priority;
    if (text.includes(term)) return 50 * priority;
    return 0;
  };

  const mapPage = (item: Record<string, any>) => ({
    type: "page",
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    href: `/${item.slug}`,
    score: Math.max(toScore(item.title, 3), toScore(item.slug, 4), toScore(item.subtitle, 2), toScore(item.description, 1))
  });

  const mapEvent = (item: Record<string, any>) => ({
    type: "event",
    title: item.title,
    subtitle: item.location ?? item.time,
    description: item.description,
    href: "/events",
    score: Math.max(toScore(item.title, 3), toScore(item.location, 2), toScore(item.description, 1))
  });

  const mapPastor = (item: Record<string, any>) => ({
    type: "pastor",
    title: item.name,
    subtitle: item.position,
    description: item.biography,
    href: `/pastors/${item.slug}`,
    score: Math.max(toScore(item.name, 4), toScore(item.position, 2), toScore(item.biography, 1))
  });

  const mapSermon = (item: Record<string, any>) => ({
    type: "sermon",
    title: item.title,
    subtitle: item.speaker,
    description: item.description,
    href: `/sermons/${item.slug}`,
    score: Math.max(toScore(item.title, 3), toScore(item.speaker, 2), toScore(item.description, 1))
  });

  const mapSection = (item: Record<string, any>) => {
    const group = item.key === "gallery" || item.pageSlug === "gallery" ? "media" : "ministries";
    return {
      type: "section",
      title: item.title,
      subtitle: item.subtitle ?? item.key,
      description: item.description ?? item.richText,
      href: item.pageSlug === "home" ? `/#${item.key}` : `/${item.pageSlug}`,
      group,
      score: Math.max(
        toScore(item.title, 3),
        toScore(item.key, 4),
        toScore(item.subtitle, 2),
        toScore(item.description, 1),
        toScore(item.richText, 1),
        toScore(item.pageSlug, 1)
      )
    };
  };

  const mapMedia = (item: Record<string, any>) => ({
    type: "media",
    title: item.publicId ?? item.url,
    subtitle: item.type,
    description: item.url,
    href: item.url,
    score: Math.max(toScore(item.publicId, 3), toScore(item.type, 2), toScore(item.url, 1))
  });

  const pageResults = pages.map(mapPage).sort((a, b) => b.score - a.score).slice(0, limit);
  const eventResults = events.map(mapEvent).sort((a, b) => b.score - a.score).slice(0, limit);
  const pastorResults = pastors.map(mapPastor).sort((a, b) => b.score - a.score).slice(0, limit);
  const sermonResults = sermons.map(mapSermon).sort((a, b) => b.score - a.score).slice(0, limit);

  const sectionResults = sections.map(mapSection).sort((a, b) => b.score - a.score);
  const ministryResults = sectionResults.filter((item) => item.group === "ministries").slice(0, limit);
  const mediaResults = [
    ...sectionResults.filter((item) => item.group === "media"),
    ...media.map(mapMedia)
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const flatResults = [
    ...pageResults,
    ...eventResults,
    ...pastorResults,
    ...sermonResults,
    ...ministryResults,
    ...mediaResults
  ].sort((a, b) => b.score - a.score);

  res.json({
    query,
    groups: {
      pages: pageResults,
      events: eventResults,
      pastors: pastorResults,
      sermons: sermonResults,
      ministries: ministryResults,
      media: mediaResults
    },
    results: flatResults
  });
}
