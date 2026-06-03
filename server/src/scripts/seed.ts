import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/db";
import { env } from "../config/env";
import { User } from "../models/User";
import { SiteSettings } from "../models/SiteSettings";
import { Page } from "../models/Page";
import { Section } from "../models/Section";
import { Pastor } from "../models/Pastor";
import { Event } from "../models/Event";
import { Sermon } from "../models/Sermon";
import { MediaAsset } from "../models/MediaAsset";

async function main() {
  await connectDatabase();

  await Promise.all([
    User.deleteMany({}),
    SiteSettings.deleteMany({}),
    Page.deleteMany({}),
    Section.deleteMany({}),
    Pastor.deleteMany({}),
    Event.deleteMany({}),
    Sermon.deleteMany({}),
    MediaAsset.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD ?? "change-me-now", 10);
  const admin = await User.create({
    name: env.SEED_ADMIN_NAME ?? "Church Admin",
    email: env.SEED_ADMIN_EMAIL ?? "admin@church.com",
    passwordHash,
    role: "admin"
  });

  await SiteSettings.create({
    churchName: "Grace House",
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
      text: "Worship with us this Sunday.",
      copyright: "Grace House Church"
    },
    socialLinks: [],
    homepageLayout: ["home", "about", "ministries", "events", "sermons", "gallery", "pastors", "contact", "search"],
    navItems: [
      { label: "Home", href: "#home", visible: true },
      { label: "About", href: "#about", visible: true },
      { label: "Ministries", href: "#ministries", visible: true },
      { label: "Events", href: "#events", visible: true },
      { label: "Gallery", href: "#gallery", visible: true },
      { label: "Pastors", href: "#pastors", visible: true },
      { label: "Contact", href: "#contact", visible: true },
      { label: "Search", href: "#search", visible: true }
    ]
  });

  await Page.insertMany([
    { slug: "home", title: "Home", subtitle: "Home", description: "A single-page church homepage with anchored sections.", published: true, visibleInNav: true },
    { slug: "about", title: "About Our Church", subtitle: "About", description: "A place for worship, discipleship, and service.", published: true, visibleInNav: true },
    { slug: "ministries", title: "Ministries", subtitle: "Ministries", description: "Explore ministry teams and outreach.", published: true, visibleInNav: true },
    { slug: "events", title: "Events", subtitle: "Events", description: "Upcoming gatherings, conferences, and special services.", published: true, visibleInNav: true },
    { slug: "gallery", title: "Gallery", subtitle: "Gallery", description: "Photos and videos from worship, outreach, and history.", published: true, visibleInNav: true },
    { slug: "pastors", title: "Pastors", subtitle: "Pastors", description: "Meet the leadership timeline.", published: true, visibleInNav: true },
    { slug: "contact", title: "Contact", subtitle: "Contact", description: "Get in touch with the church office.", published: true, visibleInNav: true },
    { slug: "sermons", title: "Sermons", subtitle: "Sermons", description: "Recent sermons and live archive content.", published: true, visibleInNav: true },
    { slug: "search", title: "Search", subtitle: "Search", description: "Search sermons, events, pastors, and pages.", published: true, visibleInNav: true }
  ]);

  await Section.insertMany([
    {
      pageSlug: "home",
      key: "about",
      title: "About Grace House",
      subtitle: "Welcome home",
      description: "This preview backend powers live demos and admin CRUD without sacrificing the feel of a real site.",
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
          description: "The homepage flows through anchored sections."
        }
      ],
      order: 0,
      hidden: false,
      published: true
    },
    {
      pageSlug: "home",
      key: "ministries",
      title: "Ministries",
      subtitle: "Serve together",
      description: "Volunteer teams, discipleship, prayer, and outreach pathways.",
      ctaButtons: [{ label: "Join a ministry", link: "#contact" }],
      blocks: [
        { type: "card", title: "Worship", description: "Music, production, and services." },
        { type: "card", title: "Prayer", description: "Care, follow-up, and encouragement." },
        { type: "card", title: "Outreach", description: "Serve the city and beyond." },
        { type: "card", title: "Youth", description: "Next-generation community and teaching." }
      ],
      order: 1,
      hidden: false,
      published: true
    },
    {
      pageSlug: "home",
      key: "events",
      title: "Events",
      subtitle: "What's coming up",
      description: "Upcoming services and gatherings with visual banners.",
      backgroundImage: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
      blocks: [
        { type: "text", heading: "Sunday worship", content: "Every Sunday morning with live service support and community fellowship." },
        {
          type: "image",
          title: "Featured gathering",
          description: "Images and videos can be uploaded in the admin.",
          url: "https://images.unsplash.com/photo-1528034997487-4b6d6f1e5b0f?auto=format&fit=crop&w=1200&q=80"
        }
      ],
      order: 2,
      hidden: false,
      published: true
    },
    {
      pageSlug: "home",
      key: "sermons",
      title: "Sermons",
      subtitle: "Watch and revisit",
      description: "Featured sermons, live recordings, and archived teaching.",
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
      pageSlug: "home",
      key: "search",
      title: "Search",
      subtitle: "Find content quickly",
      description: "Search sermons, events, pages, pastors, and everything in the preview content set.",
      blocks: [{ type: "card", title: "Quick lookup", description: "Search by speaker, title, location, or page slug." }],
      order: 7,
      hidden: false,
      published: true
    }
  ]);

  await Pastor.insertMany([
    {
      slug: "pastor-john",
      name: "Pastor John",
      position: "Lead Pastor",
      startYear: 2018,
      biography: "A shepherd focused on worship, teaching, and community outreach.",
      mainPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80",
      galleryPhotos: [],
      currentPastor: true,
      youtubeChannelId: "",
      youtubePlaylistId: ""
    }
  ]);

  await Event.insertMany([
    {
      title: "Sunday Service",
      date: new Date().toISOString(),
      time: "9:00 AM",
      location: "Main Sanctuary",
      description: "Weekly worship service.",
      registrationLink: "",
      archived: false,
      banner: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80"
    }
  ]);

  await Sermon.insertMany([
    {
      slug: "worship-in-faith",
      title: "Worship in Faith",
      description: "A sermon about worship and trust.",
      speaker: "Pastor John",
      publishDate: new Date().toISOString(),
      thumbnailUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeVideoId: "dQw4w9WgXcQ",
      duration: "32:10",
      featured: true,
      source: "manual",
      liveRecording: false,
      tags: ["worship", "faith"]
    }
  ]);

  await MediaAsset.insertMany([
    {
      type: "image",
      url: "https://images.unsplash.com/photo-1506406721470-6e8811c0f72f?auto=format&fit=crop&w=1200&q=80",
      publicId: "preview-worship-image",
      thumbUrl: "https://images.unsplash.com/photo-1506406721470-6e8811c0f72f?auto=format&fit=crop&w=1200&q=80",
      createdBy: admin._id
    },
    {
      type: "video",
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      publicId: "preview-worship-video",
      thumbUrl: "https://images.unsplash.com/photo-1517260911205-8c7c5c3c1f6e?auto=format&fit=crop&w=1200&q=80",
      createdBy: admin._id
    }
  ]);

  console.log("Preview seed complete");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
