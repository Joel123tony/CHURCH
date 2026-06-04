import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Play, Users } from "lucide-react";
import { apiFetch } from "../lib/api";
import { SectionRenderer, type SectionData } from "../components/SectionRenderer";

type YoutubeVideo = {
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  watchUrl: string;
  embedUrl: string;
};

type HomeResponse = {
  settings?: {
    churchName: string;
    shortName?: string;
    fullName?: string;
    address?: string;
    location?: string;
    primaryLanguage?: string;
    secondaryLanguage?: string;
    youtubeChannel?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    lastContentChangeAt?: string;
    about?: string;
    mission?: string;
    vision?: string;
    welcomeMessage?: string;
    communityFocus?: string[];
    socialLinks?: Array<{ label: string; href: string }>;
  };
  live?: { isLive: boolean; title?: string; viewerCount?: number; liveVideoId?: string; thumbnailUrl?: string };
  youtubeVideos?: YoutubeVideo[];
  featuredSermons?: Array<{
    title: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    publishDate?: string;
    youtubeVideoId?: string;
  }>;
  sections?: Array<SectionData & { key?: string }>;
};

const fallbackSections: SectionData[] = [
  {
    id: "about",
    anchorId: "about",
    subtitle: "About",
    title: "Methodist Tamil Church",
    description:
      "Methodist Tamil Church is a Christ-centered congregation in Padikuppam, Mogappair East, Chennai, serving through worship, prayer, biblical teaching, discipleship, fellowship, and outreach.",
    blocks: [
      {
        type: "text",
        heading: "Welcome message",
        content:
          "Welcome to Methodist Tamil Church. Whether you are visiting for the first time or have been part of our congregation for years, our prayer is that you experience God's love, grace, and presence.",
        bibleVerse: "May the Lord bless you and keep you."
      },
      {
        type: "card",
        title: "Community life",
        description: "Worship Services, Prayer Meetings, Bible Study, Youth Fellowship, Men's Fellowship, Women's Fellowship, Family Ministry, Community Outreach, and Special Church Events."
      }
    ]
  },
  {
    id: "ministries",
    anchorId: "ministries",
    subtitle: "Ministries",
    title: "Serve together in church life and outreach.",
    description: "Worship Services, Prayer Meetings, Bible Study, Youth Fellowship, Men's Fellowship, Women's Fellowship, Family Ministry, Community Outreach, and Special Church Events.",
    blocks: [
      { type: "card", title: "Worship Services", description: "Tamil and English worship centered on Christ." },
      { type: "card", title: "Prayer Meetings", description: "Intercession, encouragement, and care." },
      { type: "card", title: "Bible Study", description: "Grow in Scripture and discipleship." },
      { type: "card", title: "Community Outreach", description: "Serve families and neighbors with compassion." }
    ]
  },
  {
    id: "events",
    anchorId: "events",
    subtitle: "Events",
    title: "Upcoming gatherings keep the church connected.",
    description: "Highlight Sunday worship, prayer meetings, Bible study, youth fellowship, family ministry, and special events with rich visuals.",
    backgroundImage:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
    blocks: [
      { type: "text", heading: "Sunday worship", content: "Join us every Sunday for worship, prayer, and biblical teaching in Tamil and English." },
      { type: "image", title: "Church family", description: "Preview of a banner image uploaded from admin.", url: "https://images.unsplash.com/photo-1522638189-1d7ffb7f7c5e?auto=format&fit=crop&w=1200&q=80" }
    ]
  },
  {
    id: "sermons",
    anchorId: "sermons",
    subtitle: "Sermons",
    title: "Watch and share a full sermon archive.",
    description: "The preview includes live service detection, featured sermons, and archived recordings from Methodist Tamil Church.",
    blocks: [
      { type: "video", title: "Sunday message", description: "A featured sermon video preview.", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      { type: "button", label: "Browse sermons", link: "/search" }
    ]
  },
  {
    id: "gallery",
    anchorId: "gallery",
    subtitle: "Gallery",
    title: "Photos and media from worship, outreach, and community life.",
    description: "Upload images and videos in the admin, then surface them here as a public showcase.",
    blocks: [
      {
        type: "gallery",
        items: [
          { type: "image", url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80", title: "Worship night" },
          { type: "image", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80", title: "Leadership gathering" },
          { type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Video highlight" }
        ]
      }
    ]
  },
  {
    id: "pastors",
    anchorId: "pastors",
    subtitle: "Pastors",
    title: "Meet the shepherds who lead and care for the church.",
    description: "Build a timeline of leadership and connect each pastor to sermons, playlists, and media.",
    blocks: [
      { type: "card", title: "Lead pastor", description: "Vision, preaching, and pastoral care." },
      { type: "card", title: "Associate pastor", description: "Discipleship and community support." }
    ]
  },
  {
    id: "contact",
    anchorId: "contact",
    subtitle: "Contact",
    title: "Reach the church team anytime.",
    description: "Keep address, location, language details, and social links easy to find from the homepage.",
    blocks: [
      {
        type: "text",
        heading: "Address",
        content: "No. 1, Vandiamman Koil Street, Mogappair East, Chennai, Tamil Nadu 600107, India."
      },
      { type: "text", heading: "Languages", content: "Primary: Tamil. Secondary: English." },
      { type: "button", label: "Request prayer", link: "#contact" }
    ]
  },
];

export function HomePage() {
  const [activeVideo, setActiveVideo] = useState<YoutubeVideo | null>(null);
  const { data } = useQuery({
    queryKey: ["public", "home"],
    queryFn: () => apiFetch<HomeResponse>("/api/public/home"),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true
  });

  const settings = data?.settings ?? {
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
    lastContentChangeAt: "",
    about:
      "Methodist Tamil Church is a Christ-centered congregation in Padikuppam, Mogappair East, Chennai, serving the local community through worship, prayer, biblical teaching, discipleship, fellowship, and outreach ministries.",
    mission:
      "To glorify God through worship, proclaim the Gospel of Jesus Christ, make disciples, strengthen believers in faith, and serve the community with compassion and love.",
    vision:
      "To be a vibrant Christ-centered church that transforms lives through worship, prayer, discipleship, fellowship, and community outreach while helping people grow in their relationship with Jesus Christ.",
    welcomeMessage:
      "Welcome to Methodist Tamil Church. We are delighted to welcome you into our church family. Whether you are visiting for the first time or have been part of our congregation for many years, our prayer is that you experience God's love, grace, and presence.",
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
    socialLinks: []
  };

  const apiSections = data?.sections?.length
    ? data.sections
        .map((section) => ({
          ...section,
          anchorId: section.anchorId ?? section.key ?? section.id
        }))
        .filter((section) => !["search", "mission", "vision"].includes(String(section.anchorId ?? section.key ?? "")))
    : [];

  const sections = apiSections.length ? apiSections : fallbackSections;
  const live = data?.live?.isLive;
  const youtubeVideos =
    data?.youtubeVideos?.length
      ? data.youtubeVideos
      : (data?.featuredSermons ?? []).map((sermon) => ({
          videoId: sermon.youtubeVideoId ?? sermon.videoUrl,
          title: sermon.title,
          description: sermon.description,
          thumbnailUrl: sermon.thumbnailUrl ?? (sermon.youtubeVideoId ? `https://img.youtube.com/vi/${sermon.youtubeVideoId}/hqdefault.jpg` : undefined),
          publishedAt: sermon.publishDate,
          watchUrl: sermon.videoUrl,
          embedUrl: sermon.youtubeVideoId ? `https://www.youtube.com/embed/${sermon.youtubeVideoId}` : sermon.videoUrl
        }));

  return (
    <div>
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-radial" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-28">
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.35em] text-gold/80">{settings.shortName}</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-pearl md:text-7xl">
              {settings.fullName}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-mist/78 md:text-lg">
              {settings.about}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:scale-[1.02]" href="#sermons">
                Watch Sermons <ArrowRight className="h-4 w-4" />
              </a>
              <a className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-pearl backdrop-blur-xl transition hover:border-gold/40 hover:bg-white/10" href="#events">
                Upcoming Events
              </a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-4 md:grid-cols-3">
              {[
                { icon: Play, label: "Live Streams", href: "#sermons" },
                { icon: CalendarDays, label: "Events", href: "#events" },
                { icon: Users, label: "Pastors", href: "#pastors" }
              ].map(({ icon: Icon, label, href }) => (
                <a key={label} href={href} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:border-gold/40">
                  <Icon className="h-5 w-5 text-gold" />
                  <p className="mt-3 text-sm text-mist/80">{label}</p>
                </a>
              ))}
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Address</p>
                <p className="mt-3 text-sm leading-6 text-mist/80">{settings.address}</p>
                <p className="mt-3 text-sm text-mist/70">{settings.location}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Languages</p>
                <p className="mt-3 text-sm leading-6 text-mist/80">
                  Primary: {settings.primaryLanguage}
                  <br />
                  Secondary: {settings.secondaryLanguage}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="rounded-[2rem] border border-white/10 bg-white/8 p-4 shadow-glow backdrop-blur-2xl">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Live Service</p>
                    <p className="text-sm text-mist/80">Automatically detected from YouTube</p>
                  </div>
                  <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300">{live ? "LIVE" : "PREVIEW"}</span>
                </div>
                <div className="grid gap-4 p-4">
                  <div className="aspect-video rounded-2xl bg-[linear-gradient(135deg,rgba(215,180,106,0.22),rgba(255,255,255,0.02))]" />
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-pearl">{live ? data?.live?.title ?? "Sunday Worship Live" : "Sunday Worship Preview"}</p>
                      <p className="text-xs text-mist/70">
                        {live ? `${data?.live?.viewerCount ?? 0} watching now` : "Currently offline, sermon archive ready"}
                      </p>
                    </div>
                    <button className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink">Watch Live</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Welcome</p>
                <p className="mt-3 text-sm leading-7 text-mist/80">{settings.welcomeMessage}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Community Focus</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {settings.communityFocus?.map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-mist/80">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.35em] text-gold/80">YouTube</p>
              <h2 className="mt-3 text-3xl font-semibold text-pearl md:text-5xl">Past live broadcasts and videos</h2>
              <p className="mt-4 text-sm leading-7 text-mist/80">
                Watch recent YouTube broadcasts, open any thumbnail to play it here, or jump straight to the channel on YouTube.
              </p>
            </div>
            {settings.youtubeChannel ? (
              <a
                href={settings.youtubeChannel}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-gold/40 bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:scale-[1.02]"
              >
                Watch on YouTube
              </a>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {youtubeVideos.map((video) => (
              <button
                key={video.videoId}
                type="button"
                onClick={() => setActiveVideo(video)}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-black/20 text-left transition hover:border-gold/40"
              >
                <div className="relative aspect-video overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,rgba(215,180,106,0.22),rgba(255,255,255,0.04))] text-sm text-mist/70">
                      No thumbnail
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="grid h-16 w-16 place-items-center rounded-full border border-gold/30 bg-black/40 text-gold shadow-glow transition group-hover:scale-105">
                      <Play className="ml-1 h-6 w-6 fill-current" />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-gold/80">YouTube</p>
                  <h3 className="mt-2 text-lg font-semibold text-pearl">{video.title}</h3>
                  {video.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-mist/75">{video.description}</p> : null}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-gold/80">About</p>
            <p className="mt-4 text-sm leading-7 text-mist/80">{settings.about}</p>
          </article>
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-gold/80">Welcome</p>
            <p className="mt-4 text-sm leading-7 text-mist/80">{settings.welcomeMessage}</p>
          </article>
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-gold/80">Community</p>
            <p className="mt-4 text-sm leading-7 text-mist/80">
              Worship, prayer, Bible study, fellowship, outreach, and special church gatherings.
            </p>
          </article>
        </div>
      </section>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
      {activeVideo ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 px-4 py-8 backdrop-blur-sm" onClick={() => setActiveVideo(null)}>
          <div
            className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#08111e] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gold/80">YouTube Video</p>
                <h3 className="mt-2 text-lg font-semibold text-pearl">{activeVideo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-pearl"
              >
                Close
              </button>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-[1.6fr_0.8fr]">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                <iframe
                  src={`${activeVideo.embedUrl}?autoplay=1&rel=0`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm leading-7 text-mist/80">{activeVideo.description ?? "Watch this broadcast on YouTube."}</p>
                <a
                  href={activeVideo.watchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink"
                >
                  Watch on YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
