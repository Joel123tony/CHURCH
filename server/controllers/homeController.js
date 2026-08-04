import ContentBlock from "../models/ContentBlock.js";
import Event from "../models/Event.js";
import Gallery from "../models/Gallery.js";
import Pastor from "../models/Pastor.js";
import { getCached, setCached } from "../utils/cache.js";
import { getYoutubeHeroData, getYoutubeLatestData } from "../routes/youtubeRoutes.js";

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
  const cached = getCached("events_public_home");
  if (cached) return cached;

  try {
    const events = await Event.find().lean();
    
    // Use consistent timezone logic (Start of today in UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // Upcoming events: eventDate >= today
    const upcomingEvents = events.filter((e) => {
      const eventDate = new Date(e.date);
      eventDate.setUTCHours(0, 0, 0, 0);
      return eventDate.getTime() >= todayTimestamp;
    });
    
    // Sort upcoming events by nearest date (Ascending)
    upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Past events: eventDate < today
    const pastEvents = events.filter((e) => {
      const eventDate = new Date(e.date);
      eventDate.setUTCHours(0, 0, 0, 0);
      return eventDate.getTime() < todayTimestamp;
    });
    
    // Sort past events descending (newest first)
    pastEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let featuredEvent = null;
    let upcomingList = [];

    if (upcomingEvents.length > 0) {
      featuredEvent = upcomingEvents[0];
      upcomingList = upcomingEvents.slice(1);
    } else if (pastEvents.length > 0) {
      const latestPastEvent = pastEvents[0];
      // Calculate days difference strictly based on start-of-day timestamps
      const latestPastDate = new Date(latestPastEvent.date);
      latestPastDate.setUTCHours(0, 0, 0, 0);
      const daysSince = (todayTimestamp - latestPastDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSince <= 7) {
        featuredEvent = latestPastEvent;
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
  const cached = getCached("pastors_all");
  if (cached) return cached;

  try {
    const pastors = await Pastor.find()
      .select("name role bio image joinedYear leftYear education church email number active isCurrent createdAt")
      .sort({ createdAt: -1 })
      .lean();

    setCached("pastors_all", pastors, 60);
    return pastors;
  } catch (err) {
    console.error("Error fetching pastors:", err);
    return [];
  }
};

export const getHomePageData = async (req, res) => {
  try {
    const cachedHomePage = getCached("home_page_aggregate");
    if (cachedHomePage) {
      return res.json({ success: true, ...cachedHomePage });
    }

    const [
      cmsBlocks,
      events,
      gallery,
      pastors,
      youtubeHero,
      youtubeLatest
    ] = await Promise.all([
      getCmsBlocks(),
      getEventsData(),
      getGalleryClientData(),
      getPastorsData(),
      getYoutubeHeroData(),
      getYoutubeLatestData()
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

      youtubeHero: youtubeHero || { videoId: null, title: "No video", live: false },
      youtubeLatest: Array.isArray(youtubeLatest) ? youtubeLatest : []
    };

    setCached("home_page_aggregate", payload, 60);

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
      pastors: [],
      youtubeHero: { videoId: null, title: "No video", live: false },
      youtubeLatest: []
    });
  }
};
