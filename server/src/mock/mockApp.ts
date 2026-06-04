import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { env } from "../config/env";
import { getDatabaseStatus, setMockDatabaseStatus } from "../config/db";

type Page = {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  published: boolean;
  visibleInNav: boolean;
};

type Section = {
  id: string;
  pageSlug: string;
  key: string;
  title: string;
  subtitle?: string;
  description?: string;
  richText?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  ctaButtons: Array<{ label: string; link: string }>;
  blocks: Array<Record<string, unknown>>;
  order: number;
  hidden: boolean;
  published: boolean;
};

type Pastor = {
  slug: string;
  name: string;
  position: string;
  startYear?: number;
  endYear?: number;
  biography?: string;
  mainPhoto?: string;
  galleryPhotos: string[];
  currentPastor: boolean;
  youtubeChannelId?: string;
  youtubePlaylistId?: string;
};

type Event = {
  id: string;
  banner?: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  registrationLink?: string;
  archived: boolean;
};

type Sermon = {
  slug: string;
  title: string;
  description?: string;
  speaker?: string;
  publishDate?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  youtubeVideoId: string;
  duration?: string;
  featured: boolean;
  source: "youtube" | "manual";
  liveRecording: boolean;
  tags: string[];
};

type MediaAsset = {
  id: string;
  type: "image" | "video";
  url: string;
  publicId: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
};

type PrayerRequest = {
  id: string;
  name?: string;
  email?: string;
  message: string;
  status: "pending" | "archived" | "completed";
  notes?: string;
};

type AnalyticsEvent = {
  id: string;
  type: string;
  entityType?: string;
  entityId?: string;
  path?: string;
  searchTerm?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

type SiteSettings = {
  churchName: string;
  logoUrl?: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
  };
  typography: {
    heading: string;
    body: string;
  };
  heroBanner?: string;
  footer: {
    text: string;
    copyright: string;
  };
  socialLinks: Array<{ label: string; href: string }>;
  homepageLayout: string[];
  navItems: Array<{ label: string; href: string; visible: boolean }>;
};

const state: {
  settings: SiteSettings;
  pages: Page[];
  sections: Section[];
  pastors: Pastor[];
  events: Event[];
  sermons: Sermon[];
  media: MediaAsset[];
  requests: PrayerRequest[];
  analytics: AnalyticsEvent[];
} = {
  settings: {
    churchName: "Methodist Tamil Church",
    logoUrl: "",
    colors: {
      primary: "#d7b46a",
      accent: "#f6f1e8",
      background: "#07111f",
      surface: "#0f172a"
    },
    typography: {
      heading: "Playfair Display",
      body: "Inter"
    },
    heroBanner: "",
    footer: {
      text: "Worship with us in Tamil and English at Padikuppam.",
      copyright: "Methodist Tamil Church, Padikuppam"
    },
    socialLinks: [],
    homepageLayout: ["home", "about", "mission", "vision", "ministries", "events", "sermons", "gallery", "pastors", "contact", "search"],
    navItems: [
      { label: "Home", href: "#home", visible: true },
      { label: "About", href: "#about", visible: true },
      { label: "Mission", href: "#mission", visible: true },
      { label: "Vision", href: "#vision", visible: true },
      { label: "Ministries", href: "#ministries", visible: true },
      { label: "Events", href: "#events", visible: true },
      { label: "Gallery", href: "#gallery", visible: true },
      { label: "Pastors", href: "#pastors", visible: true },
      { label: "Contact", href: "#contact", visible: true },
      { label: "Search", href: "#search", visible: true }
    ]
  },
  pages: [
    { slug: "home", title: "Home", subtitle: "Home", description: "A single-page church homepage with anchored sections.", published: true, visibleInNav: true },
    { slug: "about", title: "About Our Church", subtitle: "About", description: "Methodist Tamil Church is a Christ-centered congregation in Padikuppam.", published: true, visibleInNav: true },
    { slug: "mission", title: "Mission", subtitle: "Mission", description: "Our mission to glorify God through worship, discipleship, and service.", published: true, visibleInNav: true },
    { slug: "vision", title: "Vision", subtitle: "Vision", description: "Our vision for a vibrant Christ-centered church.", published: true, visibleInNav: true },
    { slug: "ministries", title: "Ministries", subtitle: "Ministries", description: "Explore ministry teams and outreach.", published: true, visibleInNav: true },
    { slug: "events", title: "Events", subtitle: "Events", description: "Upcoming gatherings, conferences, and special services.", published: true, visibleInNav: true },
    { slug: "gallery", title: "Gallery", subtitle: "Gallery", description: "Photos and videos from worship, outreach, and history.", published: true, visibleInNav: true },
    { slug: "pastors", title: "Pastors", subtitle: "Pastors", description: "Meet the leadership timeline.", published: true, visibleInNav: true },
    { slug: "contact", title: "Contact", subtitle: "Contact", description: "Get in touch with Methodist Tamil Church.", published: true, visibleInNav: true },
    { slug: "sermons", title: "Sermons", subtitle: "Sermons", description: "Recent sermons and live archive content.", published: true, visibleInNav: true },
    { slug: "search", title: "Search", subtitle: "Search", description: "Search sermons, events, pastors, and pages.", published: true, visibleInNav: true }
  ],
  sections: [
    {
      id: randomUUID(),
      pageSlug: "home",
      key: "about",
      title: "About Methodist Tamil Church",
      subtitle: "Welcome home",
      description: "This mock backend powers live previews and admin CRUD without MongoDB.",
      richText: "A church platform preview with sermon archives, events, and a polished public homepage.",
      backgroundImage: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1600&q=80",
      ctaButtons: [{ label: "Learn more", link: "#ministries" }],
      blocks: [
        {
          type: "text",
          heading: "Why we built it",
          content: "The site is structured to feel like a premium church presence while staying easy to update.",
          bibleVerse: "Let all that you do be done in love."
        },
        {
          type: "card",
          title: "Single-page preview",
          description: "The homepage now flows through anchored sections."
        }
      ],
      order: 0,
      hidden: false,
      published: true
    },
    {
      id: randomUUID(),
      pageSlug: "home",
      key: "ministries",
      title: "Ministries",
      subtitle: "Serve together",
      description: "Worship Services, Prayer Meetings, Bible Study, Youth Fellowship, Men's Fellowship, Women's Fellowship, Family Ministry, Community Outreach, and Special Church Events.",
      ctaButtons: [{ label: "Join a ministry", link: "#contact" }],
      blocks: [
        { type: "card", title: "Worship Services", description: "Tamil and English worship centered on Christ." },
        { type: "card", title: "Prayer Meetings", description: "Gather for intercession, care, and encouragement." },
        { type: "card", title: "Bible Study", description: "Grow in biblical teaching and discipleship." },
        { type: "card", title: "Community Outreach", description: "Serve families and neighbors with compassion." }
      ],
      order: 1,
      hidden: false,
      published: true
    },
    {
      id: randomUUID(),
      pageSlug: "home",
      key: "events",
      title: "Events",
      subtitle: "What's coming up",
      description: "Sunday worship, prayer meetings, Bible study, youth fellowship, family ministry, and special church events.",
      backgroundImage: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
      blocks: [
        {
          type: "text",
          heading: "Sunday worship",
          content: "Join us every Sunday for worship, prayer, and biblical teaching in Tamil and English."
        },
        {
          type: "image",
          title: "Featured gathering",
          description: "Community outreach and special events can be uploaded from the admin.",
          url: "https://images.unsplash.com/photo-1528034997487-4b6d6f1e5b0f?auto=format&fit=crop&w=1200&q=80"
        }
      ],
      order: 2,
      hidden: false,
      published: true
    },
    {
      id: randomUUID(),
      pageSlug: "home",
      key: "sermons",
      title: "Sermons",
      subtitle: "Watch and revisit",
      description: "Featured sermons, live recordings, and archived teaching from Methodist Tamil Church.",
      backgroundVideo: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      blocks: [
        {
          type: "video",
          title: "Featured message",
          description: "A video preview can be uploaded or linked from the admin.",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
      ],
      order: 3,
      hidden: false,
      published: true
    },
    {
      id: randomUUID(),
      pageSlug: "home",
      key: "gallery",
      title: "Gallery",
      subtitle: "Moments from church life",
      description: "Visual memories from worship nights, outreaches, and special services.",
      blocks: [
        {
          type: "gallery",
          items: [
            { type: "image", url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80", title: "Worship night" },
            { type: "image", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80", title: "Leadership meeting" },
            { type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Video highlight" }
          ]
        }
      ],
      order: 4,
      hidden: false,
      published: true
    },
    {
      id: randomUUID(),
      pageSlug: "home",
      key: "pastors",
      title: "Pastors",
      subtitle: "Leadership and care",
      description: "Meet the team that shepherds, teaches, and serves.",
      blocks: [
        { type: "card", title: "Lead Pastor", description: "Vision, teaching, and care." },
        { type: "card", title: "Associate Pastor", description: "Discipleship and community support." }
      ],
      order: 5,
      hidden: false,
      published: true
    },
    {
      id: randomUUID(),
      pageSlug: "home",
      key: "contact",
      title: "Contact",
      subtitle: "Reach us anytime",
      description: "Office hours, location, and prayer requests all in one place.",
      blocks: [
        { type: "text", heading: "Office", content: "123 Grace Street, your city, Sunday support, and email contact details." },
        { type: "button", label: "Request prayer", link: "#search" }
      ],
      order: 6,
      hidden: false,
      published: true
    },
    {
      id: randomUUID(),
      pageSlug: "home",
      key: "search",
      title: "Search",
      subtitle: "Find content quickly",
      description: "Search sermons, events, pages, pastors, and everything in the preview content set.",
      blocks: [
        { type: "card", title: "Quick lookup", description: "Search by speaker, title, location, or page slug." }
      ],
      order: 7,
      hidden: false,
      published: true
    }
  ],
  pastors: [
    {
      slug: "pastor-john",
      name: "Pastor John",
      position: "Lead Pastor",
      startYear: 2018,
      endYear: undefined,
      biography: "A shepherd focused on worship, teaching, and community outreach.",
      mainPhoto: "",
      galleryPhotos: [],
      currentPastor: true,
      youtubeChannelId: "",
      youtubePlaylistId: ""
    }
  ],
  events: [
    {
      id: randomUUID(),
      title: "Sunday Service",
      date: new Date().toISOString(),
      time: "9:00 AM",
      location: "Main Sanctuary",
      description: "Weekly worship service.",
      registrationLink: "",
      archived: false
    }
  ],
  sermons: [
    {
      slug: "worship-in-faith",
      title: "Worship in Faith",
      description: "A sermon about worship and trust.",
      speaker: "Pastor John",
      publishDate: new Date().toISOString(),
      thumbnailUrl: "",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeVideoId: "dQw4w9WgXcQ",
      duration: "32:10",
      featured: true,
      source: "manual",
      liveRecording: false,
      tags: ["worship", "faith"]
    }
  ],
  media: [
    {
      id: randomUUID(),
      type: "image",
      url: "https://images.unsplash.com/photo-1506406721470-6e8811c0f72f?auto=format&fit=crop&w=1200&q=80",
      publicId: "preview-worship-image",
      thumbUrl: "https://images.unsplash.com/photo-1506406721470-6e8811c0f72f?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: randomUUID(),
      type: "video",
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      publicId: "preview-worship-video",
      thumbUrl: "https://images.unsplash.com/photo-1517260911205-8c7c5c3c1f6e?auto=format&fit=crop&w=1200&q=80"
    }
  ],
  requests: [],
  analytics: []
};

const upload = multer({ storage: multer.memoryStorage() });

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nextOrder(items: Array<{ order: number }>) {
  return (items.at(-1)?.order ?? -1) + 1;
}

function findSection(id: string) {
  return state.sections.find((item) => item.id === id);
}

function findPage(slug: string) {
  return state.pages.find((item) => item.slug === slug);
}

function findPastor(slug: string) {
  return state.pastors.find((item) => item.slug === slug);
}

function findEvent(id: string) {
  return state.events.find((item) => item.id === id);
}

function findSermon(slug: string) {
  return state.sermons.find((item) => item.slug === slug);
}

function ensureMockAuth(_req: express.Request, _res: express.Response, next: express.NextFunction) {
  next();
}

function bodyParser<T>(body: unknown) {
  return (body ?? {}) as T;
}

function createMockUserResponse() {
  const payload = { sub: "mock-admin", role: "admin", email: "admin@church.com" };
  return {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    user: { id: "mock-admin", email: "admin@church.com", name: "Church Admin", role: "admin" as const },
    payload
  };
}

export function createMockApp() {
  setMockDatabaseStatus();
  const app = express();
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use("/api/public", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  app.get("/", (_req, res) => {
    res
      .type("html")
      .send(
        "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Church API (Mock)</title></head><body style='font-family:Arial,sans-serif;padding:32px;line-height:1.6'><h1>Church API (Mock)</h1><p>The preview backend is running in mock mode.</p><ul><li><a href='/health'>/health</a></li><li><a href='/api/public/home'>/api/public/home</a></li></ul></body></html>"
      );
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "church-api", database: getDatabaseStatus() });
  });

  app.post("/api/auth/login", (_req, res) => {
    const auth = createMockUserResponse();
    res.cookie("accessToken", auth.accessToken, { httpOnly: true, sameSite: "lax", path: "/" });
    res.cookie("refreshToken", auth.refreshToken, { httpOnly: true, sameSite: "lax", path: "/" });
    res.json({ accessToken: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user });
  });

  app.post("/api/auth/refresh", (_req, res) => {
    const auth = createMockUserResponse();
    res.cookie("accessToken", auth.accessToken, { httpOnly: true, sameSite: "lax", path: "/" });
    res.json({ accessToken: auth.accessToken });
  });

  app.get("/api/auth/me", (_req, res) => {
    res.json({ user: createMockUserResponse().payload });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    res.json({ ok: true });
  });

  app.get("/api/public/site", (_req, res) => {
    res.json(clone(state.settings));
  });

  app.get("/api/public/home", (_req, res) => {
    res.json({
      settings: clone(state.settings),
      sections: clone(state.sections.filter((section) => section.pageSlug === "home" && section.published && !section.hidden)),
      live: { isLive: false },
      featuredSermons: clone(state.sermons.filter((sermon) => sermon.featured)),
      pastors: clone(state.pastors),
      events: clone(state.events.filter((event) => !event.archived))
    });
  });

  app.get("/api/public/search", (req, res) => {
    const query = String(req.query.q ?? "").trim().toLowerCase();
    if (!query) {
      return res.json({ results: [] });
    }

    const results = [
      ...state.sermons.filter((item) => [item.title, item.description, item.speaker, item.tags.join(" ")].join(" ").toLowerCase().includes(query)).map((item) => ({ type: "sermon", item })),
      ...state.events.filter((item) => [item.title, item.location, item.description].join(" ").toLowerCase().includes(query)).map((item) => ({ type: "event", item })),
      ...state.pastors.filter((item) => [item.name, item.position, item.biography].join(" ").toLowerCase().includes(query)).map((item) => ({ type: "pastor", item })),
      ...state.pages.filter((item) => [item.slug, item.title, item.description].join(" ").toLowerCase().includes(query)).map((item) => ({ type: "page", item }))
    ];

    state.analytics.push({
      id: randomUUID(),
      type: "search",
      searchTerm: query,
      createdAt: new Date().toISOString()
    });

    res.json({ results });
  });

  app.get("/api/public/pages", (_req, res) => {
    res.json(clone(state.pages));
  });

  app.get("/api/public/pages/:slug", (req, res) => {
    const item = findPage(req.params.slug);
    if (!item) return res.status(404).json({ message: "Page not found" });
    res.json(clone(item));
  });

  app.get("/api/public/pastors", (_req, res) => {
    res.json(clone(state.pastors));
  });

  app.get("/api/public/pastors/:slug", (req, res) => {
    const item = findPastor(req.params.slug);
    if (!item) return res.status(404).json({ message: "Pastor not found" });
    res.json({ pastor: clone(item), sermons: clone(state.sermons) });
  });

  app.get("/api/public/events", (_req, res) => {
    res.json(clone(state.events.filter((item) => !item.archived)));
  });

  app.get("/api/public/sermons", (_req, res) => {
    res.json(clone(state.sermons));
  });

  app.get("/api/public/sermons/:slug", (req, res) => {
    const item = findSermon(req.params.slug);
    if (!item) return res.status(404).json({ message: "Sermon not found" });
    res.json(clone(item));
  });

  app.get("/api/pages", (_req, res) => res.json(clone(state.pages)));
  app.get("/api/pages/:slug", (req, res) => {
    const item = findPage(req.params.slug);
    if (!item) return res.status(404).json({ message: "Page not found" });
    res.json(clone(item));
  });
  app.post("/api/pages", ensureMockAuth, (req, res) => {
    const body = bodyParser<Page>(req.body);
    const page: Page = {
      slug: body.slug || slugify(body.title || "page"),
      title: body.title || "Untitled Page",
      subtitle: body.subtitle,
      description: body.description,
      published: Boolean(body.published),
      visibleInNav: Boolean(body.visibleInNav)
    };
    state.pages.push(page);
    res.status(201).json(clone(page));
  });
  app.put("/api/pages/:slug", ensureMockAuth, (req, res) => {
    const item = findPage(req.params.slug);
    if (!item) return res.status(404).json({ message: "Page not found" });
    Object.assign(item, req.body);
    res.json(clone(item));
  });
  app.delete("/api/pages/:slug", ensureMockAuth, (req, res) => {
    const before = state.pages.length;
    state.pages = state.pages.filter((item) => item.slug !== req.params.slug);
    res.status(before === state.pages.length ? 404 : 204).end();
  });

  app.get("/api/sections", (req, res) => {
    const pageSlug = String(req.query.pageSlug ?? "home");
    res.json(clone(state.sections.filter((item) => item.pageSlug === pageSlug).sort((a, b) => a.order - b.order)));
  });
  app.post("/api/sections", ensureMockAuth, (req, res) => {
    const body = bodyParser<Partial<Section>>(req.body);
    const item: Section = {
      id: randomUUID(),
      pageSlug: body.pageSlug || "home",
      key: body.key || slugify(body.title || "section"),
      title: body.title || "Untitled Section",
      subtitle: body.subtitle,
      description: body.description,
      richText: body.richText,
      backgroundImage: body.backgroundImage,
      backgroundVideo: body.backgroundVideo,
      ctaButtons: Array.isArray(body.ctaButtons) ? body.ctaButtons : [],
      blocks: Array.isArray(body.blocks) ? body.blocks : [],
      order: body.order ?? nextOrder(state.sections),
      hidden: Boolean(body.hidden),
      published: Boolean(body.published)
    };
    state.sections.push(item);
    res.status(201).json(clone(item));
  });
  app.put("/api/sections/reorder", ensureMockAuth, (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    for (const item of items) {
      const section = findSection(String(item.id));
      if (section) section.order = Number(item.order);
    }
    res.json({ ok: true });
  });
  app.post("/api/sections/:id/duplicate", ensureMockAuth, (req, res) => {
    const item = findSection(req.params.id);
    if (!item) return res.status(404).json({ message: "Section not found" });
    const copy = {
      ...clone(item),
      id: randomUUID(),
      key: `${item.key}-copy`,
      published: false,
      hidden: true
    };
    state.sections.push(copy);
    res.status(201).json(clone(copy));
  });
  app.post("/api/sections/:id/publish", ensureMockAuth, (req, res) => {
    const item = findSection(req.params.id);
    if (!item) return res.status(404).json({ message: "Section not found" });
    item.published = true;
    item.hidden = false;
    res.json(clone(item));
  });
  app.post("/api/sections/:id/hide", ensureMockAuth, (req, res) => {
    const item = findSection(req.params.id);
    if (!item) return res.status(404).json({ message: "Section not found" });
    item.hidden = true;
    res.json(clone(item));
  });
  app.put("/api/sections/:id", ensureMockAuth, (req, res) => {
    const item = findSection(req.params.id);
    if (!item) return res.status(404).json({ message: "Section not found" });
    Object.assign(item, req.body);
    res.json(clone(item));
  });
  app.delete("/api/sections/:id", ensureMockAuth, (req, res) => {
    const before = state.sections.length;
    state.sections = state.sections.filter((item) => item.id !== req.params.id);
    res.status(before === state.sections.length ? 404 : 204).end();
  });

  app.get("/api/pastors", (_req, res) => res.json(clone(state.pastors)));
  app.get("/api/pastors/:slug", (req, res) => {
    const item = findPastor(req.params.slug);
    if (!item) return res.status(404).json({ message: "Pastor not found" });
    res.json(clone(item));
  });
  app.post("/api/pastors", ensureMockAuth, (req, res) => {
    const body = bodyParser<Partial<Pastor>>(req.body);
    const item: Pastor = {
      slug: body.slug || slugify(body.name || "pastor"),
      name: body.name || "Untitled Pastor",
      position: body.position || "Pastor",
      startYear: body.startYear,
      endYear: body.endYear,
      biography: body.biography,
      mainPhoto: body.mainPhoto,
      galleryPhotos: Array.isArray(body.galleryPhotos) ? body.galleryPhotos : [],
      currentPastor: Boolean(body.currentPastor),
      youtubeChannelId: body.youtubeChannelId,
      youtubePlaylistId: body.youtubePlaylistId
    };
    state.pastors.push(item);
    res.status(201).json(clone(item));
  });
  app.put("/api/pastors/:slug", ensureMockAuth, (req, res) => {
    const item = findPastor(req.params.slug);
    if (!item) return res.status(404).json({ message: "Pastor not found" });
    Object.assign(item, req.body);
    res.json(clone(item));
  });
  app.delete("/api/pastors/:slug", ensureMockAuth, (req, res) => {
    const before = state.pastors.length;
    state.pastors = state.pastors.filter((item) => item.slug !== req.params.slug);
    res.status(before === state.pastors.length ? 404 : 204).end();
  });

  app.get("/api/events", (_req, res) => res.json(clone(state.events)));
  app.post("/api/events", ensureMockAuth, (req, res) => {
    const body = bodyParser<Partial<Event>>(req.body);
    const item: Event = {
      id: randomUUID(),
      banner: body.banner,
      title: body.title || "Untitled Event",
      date: body.date || new Date().toISOString(),
      time: body.time,
      location: body.location,
      description: body.description,
      registrationLink: body.registrationLink,
      archived: Boolean(body.archived)
    };
    state.events.push(item);
    res.status(201).json(clone(item));
  });
  app.put("/api/events/:id", ensureMockAuth, (req, res) => {
    const item = findEvent(req.params.id);
    if (!item) return res.status(404).json({ message: "Event not found" });
    Object.assign(item, req.body);
    res.json(clone(item));
  });
  app.post("/api/events/:id/archive", ensureMockAuth, (req, res) => {
    const item = findEvent(req.params.id);
    if (!item) return res.status(404).json({ message: "Event not found" });
    item.archived = true;
    res.json(clone(item));
  });

  app.get("/api/sermons", (_req, res) => res.json(clone(state.sermons)));
  app.get("/api/sermons/:slug", (req, res) => {
    const item = findSermon(req.params.slug);
    if (!item) return res.status(404).json({ message: "Sermon not found" });
    res.json(clone(item));
  });
  app.post("/api/sermons", ensureMockAuth, (req, res) => {
    const body = bodyParser<Partial<Sermon>>(req.body);
    const item: Sermon = {
      slug: body.slug || slugify(body.title || "sermon"),
      title: body.title || "Untitled Sermon",
      description: body.description,
      speaker: body.speaker,
      publishDate: body.publishDate || new Date().toISOString(),
      thumbnailUrl: body.thumbnailUrl,
      videoUrl: body.videoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeVideoId: body.youtubeVideoId || randomUUID(),
      duration: body.duration,
      featured: Boolean(body.featured),
      source: body.source || "manual",
      liveRecording: Boolean(body.liveRecording),
      tags: Array.isArray(body.tags) ? body.tags : []
    };
    state.sermons.push(item);
    res.status(201).json(clone(item));
  });
  app.put("/api/sermons/:youtubeVideoId", ensureMockAuth, (req, res) => {
    const item = state.sermons.find((entry) => entry.youtubeVideoId === req.params.youtubeVideoId);
    if (!item) return res.status(404).json({ message: "Sermon not found" });
    Object.assign(item, req.body);
    res.json(clone(item));
  });
  app.delete("/api/sermons/:youtubeVideoId", ensureMockAuth, (req, res) => {
    const before = state.sermons.length;
    state.sermons = state.sermons.filter((item) => item.youtubeVideoId !== req.params.youtubeVideoId);
    res.status(before === state.sermons.length ? 404 : 204).end();
  });

  app.get("/api/media", ensureMockAuth, (_req, res) => res.json(clone(state.media)));
  app.post("/api/media", ensureMockAuth, (req, res) => {
    const body = bodyParser<Partial<MediaAsset>>(req.body);
    const item: MediaAsset = {
      id: randomUUID(),
      type: body.type || "image",
      url: body.url || "",
      publicId: body.publicId || randomUUID(),
      thumbUrl: body.thumbUrl,
      width: body.width,
      height: body.height
    };
    state.media.push(item);
    res.status(201).json(clone(item));
  });
  app.post("/api/media/upload", ensureMockAuth, upload.single("file"), (req, res) => {
    if (req.file) {
      const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const item: MediaAsset = {
        id: randomUUID(),
        type: req.file.mimetype.startsWith("video/") ? "video" : "image",
        url: dataUrl,
        publicId: randomUUID(),
        thumbUrl: dataUrl
      };
      state.media.push(item);
      return res.status(201).json({ asset: clone(item), uploaded: clone(item) });
    }

    const item: MediaAsset = {
      id: randomUUID(),
      type: "image",
      url: String(req.body?.url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a"),
      publicId: randomUUID(),
      thumbUrl: String(req.body?.url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a")
    };
    state.media.push(item);
    res.status(201).json({ asset: clone(item), uploaded: clone(item) });
  });
  app.delete("/api/media/:id", ensureMockAuth, (req, res) => {
    const before = state.media.length;
    state.media = state.media.filter((item) => item.id !== req.params.id);
    res.status(before === state.media.length ? 404 : 204).end();
  });

  app.post("/api/requests", (req, res) => {
    const body = bodyParser<Partial<PrayerRequest>>(req.body);
    const item: PrayerRequest = {
      id: randomUUID(),
      name: body.name,
      email: body.email,
      message: body.message || "Prayer request",
      status: "pending",
      notes: body.notes
    };
    state.requests.push(item);
    res.status(201).json(clone(item));
  });
  app.get("/api/requests", ensureMockAuth, (_req, res) => res.json(clone(state.requests)));
  app.put("/api/requests/:id", ensureMockAuth, (req, res) => {
    const item = state.requests.find((entry) => entry.id === req.params.id);
    if (!item) return res.status(404).json({ message: "Prayer request not found" });
    Object.assign(item, req.body);
    res.json(clone(item));
  });

  app.post("/api/analytics/track", (req, res) => {
    const body = bodyParser<Partial<AnalyticsEvent>>(req.body);
    const item: AnalyticsEvent = {
      id: randomUUID(),
      type: body.type || "visit",
      entityType: body.entityType,
      entityId: body.entityId,
      path: body.path,
      searchTerm: body.searchTerm,
      metadata: body.metadata,
      createdAt: new Date().toISOString()
    };
    state.analytics.push(item);
    res.status(201).json(clone(item));
  });
  app.get("/api/analytics", ensureMockAuth, (_req, res) => res.json(clone(state.analytics)));
  app.get("/api/analytics/summary", ensureMockAuth, (_req, res) => {
    res.json({
      visitors: state.analytics.filter((item) => item.type === "visit").length,
      pastors: state.pastors.length,
      sermons: state.sermons.length,
      events: state.events.filter((item) => !item.archived).length,
      videos: state.media.filter((item) => item.type === "video").length,
      images: state.media.filter((item) => item.type === "image").length
    });
  });

  app.get("/api/youtube/live", (_req, res) => res.json({ isLive: false }));

  app.get("/api/admin/dashboard", ensureMockAuth, (_req, res) => {
    res.json({
      visitors: state.analytics.filter((item) => item.type === "visit").length,
      pastors: state.pastors.length,
      sermons: state.sermons.length,
      events: state.events.filter((item) => !item.archived).length,
      videos: state.media.filter((item) => item.type === "video").length,
      images: state.media.filter((item) => item.type === "image").length
    });
  });
  app.get("/api/admin/sections", ensureMockAuth, (req, res) => {
    const pageSlug = String(req.query.pageSlug ?? "home");
    res.json(clone(state.sections.filter((item) => item.pageSlug === pageSlug).sort((a, b) => a.order - b.order)));
  });
  app.put("/api/admin/settings", ensureMockAuth, (req, res) => {
    state.settings = { ...state.settings, ...req.body, colors: { ...state.settings.colors, ...(req.body?.colors ?? {}) }, typography: { ...state.settings.typography, ...(req.body?.typography ?? {}) }, footer: { ...state.settings.footer, ...(req.body?.footer ?? {}) } };
    res.json(clone(state.settings));
  });
  app.get("/api/admin/prayer-requests", ensureMockAuth, (_req, res) => res.json(clone(state.requests)));
  app.get("/api/admin/analytics", ensureMockAuth, (_req, res) => res.json(clone(state.analytics)));

  app.use((_req, res) => {
    res.status(404).json({ message: "Not found (mock mode)" });
  });

  return app;
}
