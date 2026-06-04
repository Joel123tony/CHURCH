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
    churchName: "Methodist Tamil Church",
    shortName: "MTC Padikuppam",
    fullName: "Methodist Tamil Church, Padikuppam",
    address: "No. 1, Vandiamman Koil Street, Mogappair East, Chennai, Tamil Nadu 600107, India",
    location: "Padikuppam, Mogappair East, Chennai, Tamil Nadu, India",
    primaryLanguage: "Tamil",
    secondaryLanguage: "English",
    youtubeChannel: "https://www.youtube.com/@MethodistChurchPadikuppam",
    facebookUrl: "https://facebook.com/profile.php?id=61582424267282",
    instagramUrl: "https://instagram.com/methodist_chruch_padikuppam",
    about:
      "Methodist Tamil Church is a Christ-centered congregation located in Padikuppam, Mogappair East, Chennai. The church serves the local community through worship, prayer, biblical teaching, discipleship, fellowship, and outreach ministries. We are committed to sharing the love of Jesus Christ, strengthening families, nurturing spiritual growth, and building a welcoming church community for people of all ages.",
    mission:
      "To glorify God through worship, proclaim the Gospel of Jesus Christ, make disciples, strengthen believers in faith, and serve the community with compassion and love.",
    vision:
      "To be a vibrant Christ-centered church that transforms lives through worship, prayer, discipleship, fellowship, and community outreach while helping people grow in their relationship with Jesus Christ.",
    welcomeMessage:
      "Welcome to Methodist Tamil Church. We are delighted to welcome you into our church family. Whether you are visiting for the first time or have been part of our congregation for many years, our prayer is that you experience God's love, grace, and presence. Join us as we worship together, grow in faith, and serve our community in the name of Jesus Christ.",
    communityFocus: [
      "Worship Services",
      "Prayer Meetings",
      "Bible Study",
      "Youth Fellowship",
      "Men's Fellowship",
      "Women's Fellowship",
      "Family Ministry",
      "Community Outreach",
      "Special Church Events"
    ],
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
    socialLinks: [
      { label: "YouTube", href: "https://www.youtube.com/@MethodistChurchPadikuppam" },
      { label: "Facebook", href: "https://facebook.com/profile.php?id=61582424267282" },
      { label: "Instagram", href: "https://instagram.com/methodist_chruch_padikuppam" }
    ],
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
  });

  await Page.insertMany([
    { slug: "home", title: "Home", subtitle: "Home", description: "A single-page church homepage with anchored sections.", published: true, visibleInNav: true },
    { slug: "about", title: "About Our Church", subtitle: "About", description: "A place for worship, discipleship, and service.", published: true, visibleInNav: true },
    { slug: "mission", title: "Mission", subtitle: "Mission", description: "Our mission to glorify God through worship, discipleship, and service.", published: true, visibleInNav: true },
    { slug: "vision", title: "Vision", subtitle: "Vision", description: "Our vision for a vibrant Christ-centered church.", published: true, visibleInNav: true },
    { slug: "ministries", title: "Ministries", subtitle: "Ministries", description: "Explore ministry teams and outreach.", published: true, visibleInNav: true },
    { slug: "events", title: "Events", subtitle: "Events", description: "Upcoming gatherings, conferences, and special services.", published: true, visibleInNav: true },
    { slug: "gallery", title: "Gallery", subtitle: "Gallery", description: "Photos and videos from worship, outreach, and history.", published: true, visibleInNav: true },
    { slug: "pastors", title: "Pastors", subtitle: "Pastors", description: "Meet the leadership timeline.", published: true, visibleInNav: true },
    { slug: "contact", title: "Contact", subtitle: "Contact", description: "Get in touch with Methodist Tamil Church.", published: true, visibleInNav: true },
    { slug: "sermons", title: "Sermons", subtitle: "Sermons", description: "Recent sermons and live archive content.", published: true, visibleInNav: true },
    { slug: "search", title: "Search", subtitle: "Search", description: "Search sermons, events, pastors, and pages.", published: true, visibleInNav: true }
  ]);

  await Section.insertMany([
    {
      pageSlug: "home",
      key: "about",
      title: "About Methodist Tamil Church",
      subtitle: "Welcome home",
      description:
        "Methodist Tamil Church is a Christ-centered congregation located in Padikuppam, Mogappair East, Chennai, serving the local community through worship, prayer, biblical teaching, discipleship, fellowship, and outreach ministries.",
      richText:
        "We are committed to sharing the love of Jesus Christ, strengthening families, nurturing spiritual growth, and building a welcoming church community for people of all ages.",
      backgroundImage: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1600&q=80",
      ctaButtons: [{ label: "Learn more", link: "#mission" }],
      blocks: [
        {
          type: "text",
          heading: "Welcome message",
          content:
            "Welcome to Methodist Tamil Church. We are delighted to welcome you into our church family. Whether you are visiting for the first time or have been part of our congregation for many years, our prayer is that you experience God's love, grace, and presence.",
          bibleVerse: "May the Lord bless you and keep you."
        },
        {
          type: "card",
          title: "About our church",
          description: "Christ-centered worship, prayer, teaching, discipleship, fellowship, and outreach."
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
      description:
        "Worship Services, Prayer Meetings, Bible Study, Youth Fellowship, Men's Fellowship, Women's Fellowship, Family Ministry, Community Outreach, and Special Church Events.",
      ctaButtons: [{ label: "Join a ministry", link: "#contact" }],
      blocks: [
        { type: "card", title: "Worship Services", description: "Tamil and English worship that centers on Christ." },
        { type: "card", title: "Prayer Meetings", description: "Gather for intercession, care, and encouragement." },
        { type: "card", title: "Bible Study", description: "Grow in biblical teaching and discipleship." },
        { type: "card", title: "Community Outreach", description: "Serve families and neighbors with compassion." }
      ],
      order: 1,
      hidden: false,
      published: true
    },
    {
      pageSlug: "home",
      key: "mission",
      title: "Mission",
      subtitle: "Why we serve",
      description:
        "To glorify God through worship, proclaim the Gospel of Jesus Christ, make disciples, strengthen believers in faith, and serve the community with compassion and love.",
      blocks: [
        {
          type: "text",
          heading: "Our mission",
          content:
            "To glorify God through worship, proclaim the Gospel of Jesus Christ, make disciples, strengthen believers in faith, and serve the community with compassion and love."
        }
      ],
      order: 2,
      hidden: false,
      published: true
    },
    {
      pageSlug: "home",
      key: "vision",
      title: "Vision",
      subtitle: "What we are building",
      description:
        "To be a vibrant Christ-centered church that transforms lives through worship, prayer, discipleship, fellowship, and community outreach while helping people grow in their relationship with Jesus Christ.",
      blocks: [
        {
          type: "text",
          heading: "Our vision",
          content:
            "To be a vibrant Christ-centered church that transforms lives through worship, prayer, discipleship, fellowship, and community outreach while helping people grow in their relationship with Jesus Christ."
        }
      ],
      order: 3,
      hidden: false,
      published: true
    },
    {
      pageSlug: "home",
      key: "events",
      title: "Events",
      subtitle: "What's coming up",
      description: "Sunday worship, prayer meetings, Bible study, youth fellowship, family ministry, and special church events.",
      backgroundImage: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
      blocks: [
        { type: "text", heading: "Sunday worship", content: "Join us every Sunday for worship, prayer, and biblical teaching in Tamil and English." },
        {
          type: "image",
          title: "Featured gathering",
          description: "Community outreach and special events can be uploaded from the admin.",
          url: "https://images.unsplash.com/photo-1528034997487-4b6d6f1e5b0f?auto=format&fit=crop&w=1200&q=80"
        }
      ],
      order: 4,
      hidden: false,
      published: true
    },
    {
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
      order: 5,
      hidden: false,
      published: true
    },
    {
      pageSlug: "home",
      key: "gallery",
      title: "Gallery",
      subtitle: "Moments from church life",
      description: "Visual memories from worship services, prayer meetings, Bible study, youth fellowship, and community outreach.",
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
      order: 6,
      hidden: false,
      published: true
    },
    {
      pageSlug: "home",
      key: "pastors",
      title: "Pastors",
      subtitle: "Leadership and care",
      description: "Meet the team that shepherds, teaches, and serves the Methodist Tamil Church community.",
      blocks: [
        { type: "card", title: "Lead Pastor", description: "Vision, teaching, and care." },
        { type: "card", title: "Associate Pastor", description: "Discipleship and community support." }
      ],
      order: 7,
      hidden: false,
      published: true
    },
    {
      pageSlug: "home",
      key: "contact",
      title: "Contact",
      subtitle: "Reach us anytime",
      description: "Address, location, language details, and social links for Methodist Tamil Church.",
      blocks: [
        {
          type: "text",
          heading: "Address",
          content: "No. 1, Vandiamman Koil Street, Mogappair East, Chennai, Tamil Nadu 600107, India"
        },
        { type: "text", heading: "Languages", content: "Primary: Tamil. Secondary: English." },
        { type: "button", label: "Request prayer", link: "#search" }
      ],
      order: 8,
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
      order: 9,
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
      biography: "A shepherd focused on worship, teaching, discipleship, and community outreach.",
      mainPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80",
      galleryPhotos: [],
      currentPastor: true,
      youtubeChannelId: "",
      youtubePlaylistId: ""
    }
  ]);

  await Event.insertMany([
    {
      title: "Sunday Worship Service",
      date: new Date().toISOString(),
      time: "9:00 AM",
      location: "Methodist Tamil Church, Padikuppam",
      description: "Weekly Tamil and English worship service.",
      registrationLink: "",
      archived: false,
      banner: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80"
    }
  ]);

  await Sermon.insertMany([
    {
      slug: "worship-in-faith",
      title: "Worship in Faith",
      description: "A sermon about worship, trust, and growing in Christ.",
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
      publicId: "methodist-worship-image",
      thumbUrl: "https://images.unsplash.com/photo-1506406721470-6e8811c0f72f?auto=format&fit=crop&w=1200&q=80",
      createdBy: admin._id
    },
    {
      type: "video",
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      publicId: "methodist-worship-video",
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
