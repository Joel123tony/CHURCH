import ContentBlock from "../models/ContentBlock.js";
import Event from "../models/Event.js";
import Gallery from "../models/Gallery.js";
import Pastor from "../models/Pastor.js";
import { getCached, setCached, isCacheStale } from "../utils/cache.js";

const cmsKeys = [
  "section-order",
  "hero",
  "history",
  "events",
  "gallery",
  "pastor",
  "testimonials",
  "youtube"
];

const getCmsBlocks = async () => {
  const result = {};
  const missingKeys = [];

  for (const key of cmsKeys) {
    const cached = getCached(`content_${key}`);
    if (cached) {
      result[key] = cached;
    } else {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    try {
      const blocks = await ContentBlock.find({ key: { $in: missingKeys } }).lean();
      const foundMap = new Map();
      blocks.forEach((b) => foundMap.set(b.key, b));

      for (const key of missingKeys) {
        const b = foundMap.get(key);
        const dataPayload = b || { key, data: {} };
        setCached(`content_${key}`, dataPayload, 60);
        result[key] = dataPayload;
      }
    } catch (err) {
      console.error("Error fetching CMS blocks:", err);
      missingKeys.forEach((key) => {
        result[key] = { key, data: {} };
      });
    }
  }

  return result;
};

const getEventsData = async () => {
  const cached = getCached("events_public_home", true);
  if (cached && !isCacheStale("events_public_home")) return cached;

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const upcomingEvents = await Event.find({ date: { $gte: today } })
      .sort({ date: 1 })
      .limit(6)
      .lean();

    let featuredEvent = null;
    let upcomingList = [];

    if (upcomingEvents.length > 0) {
      featuredEvent = upcomingEvents[0];
      upcomingList = upcomingEvents.slice(1);
    } else {
      const pastEvents = await Event.find({ date: { $lt: today } })
        .sort({ date: -1 })
        .limit(1)
        .lean();
      
      if (pastEvents.length > 0) {
        const latestPastEvent = pastEvents[0];
        const latestPastDate = new Date(latestPastEvent.date);
        latestPastDate.setUTCHours(0, 0, 0, 0);
        const daysSince = (today.getTime() - latestPastDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSince <= 7) {
          featuredEvent = latestPastEvent;
        }
      }
    }

    const resultData = { featuredEvent, upcomingEvents: upcomingList };
    setCached("events_public_home", resultData, 60);
    return resultData;
  } catch (err) {
    console.error("Error fetching public events:", err);
    return { featuredEvent: null, upcomingEvents: [] };
  }
};

const getGalleryClientData = async () => {
  const cached = getCached("gallery_client");
  if (cached) return cached;

  try {
    const media = await Gallery.find({ clientPriority: { $ne: null } })
      .select("url thumbnail title mediaType category eventDate createdAt clientPriority")
      .sort({ clientPriority: 1 })
      .limit(4)
      .lean();

    setCached("gallery_client", media, 60);
    return media;
  } catch (err) {
    console.error("Error fetching client gallery:", err);
    return [];
  }
};

const getPastorsData = async () => {
  const cached = getCached("pastors_current", true);
  if (cached && !isCacheStale("pastors_current")) return cached;

  try {
    const pastors = await Pastor.find({ isCurrent: true })
      .select("name role bio image joinedYear leftYear education church email number active isCurrent createdAt")
      .sort({ createdAt: -1 })
      .lean();

    setCached("pastors_current", pastors, 60);
    return pastors;
  } catch (err) {
    console.error("Error fetching pastors:", err);
    return [];
  }
};

const refreshHomePageData = async () => {
  const [
    cmsBlocks,
    events,
    gallery,
    pastors
  ] = await Promise.all([
    getCmsBlocks(),
    getEventsData(),
    getGalleryClientData(),
    getPastorsData()
  ]);

  const sectionOrderData = cmsBlocks["section-order"]?.data || cmsBlocks["section-order"] || [];
  const sectionOrder = Array.isArray(sectionOrderData)
    ? sectionOrderData
    : sectionOrderData?.order || ["hero", "history", "events", "gallery", "pastor", "testimonials", "youtube"];

  const payload = {
    sectionOrder,
    hero: cmsBlocks["hero"]?.data || cmsBlocks["hero"] || {},
    history: cmsBlocks["history"]?.data || cmsBlocks["history"] || {},
    eventsContent: cmsBlocks["events"]?.data || cmsBlocks["events"] || {},
    galleryContent: cmsBlocks["gallery"]?.data || cmsBlocks["gallery"] || {},
    pastorContent: cmsBlocks["pastor"]?.data || cmsBlocks["pastor"] || {},
    testimonialsContent: cmsBlocks["testimonials"]?.data || cmsBlocks["testimonials"] || {},
    youtubeContent: cmsBlocks["youtube"]?.data || cmsBlocks["youtube"] || {},

    events: events || { featuredEvent: null, upcomingEvents: [] },
    gallery: Array.isArray(gallery) ? gallery : [],
    pastors: Array.isArray(pastors) ? pastors : [],
  };

  setCached("home_page_aggregate", payload, 60);
  return payload;
};

export const getHomePageData = async (req, res) => {
  try {
    const cachedHomePage = getCached("home_page_aggregate", true);
    if (cachedHomePage) {
      if (isCacheStale("home_page_aggregate")) {
        // Trigger background refresh without awaiting
        refreshHomePageData().catch(err => console.error("Background home page refresh failed:", err));
      }
      return res.json({ success: true, ...cachedHomePage });
    }

    const payload = await refreshHomePageData();
    return res.json({
      success: true,
      ...payload
    });
  } catch (err) {
    console.error("Home aggregate endpoint error:", err);
    return res.json({
      success: false,
      sectionOrder: ["hero", "history", "events", "gallery", "pastor", "testimonials", "youtube"],
      hero: {},
      history: {},
      eventsContent: {},
      galleryContent: {},
      pastorContent: {},
      testimonialsContent: {},
      youtubeContent: {},
      events: [],
      gallery: [],
      pastors: []
    });
  }
};
