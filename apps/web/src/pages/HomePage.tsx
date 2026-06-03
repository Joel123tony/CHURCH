import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Play, Search, Users } from "lucide-react";
import { apiFetch } from "../lib/api";
import { SectionRenderer, type SectionData } from "../components/SectionRenderer";

type HomeResponse = {
  live?: { isLive: boolean; title?: string; viewerCount?: number };
  sections?: Array<SectionData & { key?: string }>;
};

const fallbackSections: SectionData[] = [
  {
    id: "about",
    anchorId: "about",
    subtitle: "About Grace House",
    title: "A church home designed for worship, care, and community.",
    description:
      "Our preview experience brings together sermons, live streams, events, pastors, and outreach into one clear, elegant page.",
    blocks: [
      {
        type: "text",
        heading: "Why we exist",
        content:
          "We help church teams keep the public site fresh without depending on a developer for every update.",
        bibleVerse: "Let all that you do be done in love."
      },
      {
        type: "card",
        title: "Flexible content model",
        description: "Swap sections, upload media, and rearrange the homepage from the admin panel."
      }
    ]
  },
  {
    id: "ministries",
    anchorId: "ministries",
    subtitle: "Ministries",
    title: "Serve in the places where your gifts matter most.",
    description: "Build volunteer pathways, outreach teams, and ministry moments that are easy to update.",
    blocks: [
      { type: "card", title: "Worship", description: "Music, production, and worship planning." },
      { type: "card", title: "Discipleship", description: "Bible study, groups, and mentorship." },
      { type: "card", title: "Outreach", description: "Serve the city with compassion and action." },
      { type: "card", title: "Prayer", description: "Prayer requests, follow-up, and pastoral care." }
    ]
  },
  {
    id: "events",
    anchorId: "events",
    subtitle: "Events",
    title: "Upcoming gatherings keep the whole church moving together.",
    description: "Highlight conferences, special services, and ministry gatherings with rich visuals.",
    backgroundImage:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
    blocks: [
      { type: "text", heading: "Sunday worship", content: "Join us every Sunday for worship, prayer, and teaching." },
      { type: "image", title: "Church family", description: "Preview of a banner image uploaded from admin.", url: "https://images.unsplash.com/photo-1522638189-1d7ffb7f7c5e?auto=format&fit=crop&w=1200&q=80" }
    ]
  },
  {
    id: "sermons",
    anchorId: "sermons",
    subtitle: "Sermons",
    title: "Watch and share a full sermon archive.",
    description: "The preview includes live service detection, featured sermons, and archived recordings.",
    blocks: [
      { type: "video", title: "Sunday message", description: "A featured sermon video preview.", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      { type: "button", label: "Browse sermons", link: "#search" }
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
    description: "Keep office hours, service times, and contact routes easy to find from the homepage.",
    blocks: [
      { type: "text", heading: "Office", content: "123 Grace Street, Sunday support, prayer line, and email contact can all live here." },
      { type: "button", label: "Request prayer", link: "#search" }
    ]
  },
  {
    id: "search",
    anchorId: "search",
    subtitle: "Search",
    title: "Find sermons, events, pages, and pastors in seconds.",
    description: "This preview keeps local search history and supports a full-site content lookup experience.",
    blocks: [
      { type: "card", title: "Fast lookup", description: "Search by title, speaker, location, or page slug." }
    ]
  }
];

export function HomePage() {
  const { data } = useQuery({
    queryKey: ["home"],
    queryFn: () => apiFetch<HomeResponse>("/api/public/home")
  });

  const apiSections = data?.sections?.length
    ? data.sections.map((section) => ({
        ...section,
        anchorId: section.anchorId ?? section.key ?? section.id
      }))
    : [];

  const sections = apiSections.length ? apiSections : fallbackSections;
  const live = data?.live?.isLive;

  return (
    <div>
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-radial" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-28">
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Grace House Church</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-pearl md:text-7xl">
              A single-page church experience for worship, community, and outreach.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-mist/78 md:text-lg">
              Everything is arranged as one flowing landing page, with anchored sections for sermons, events, pastors, media, and contact details that staff can update from the admin panel.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:scale-[1.02]" href="#sermons">
                Watch Sermons <ArrowRight className="h-4 w-4" />
              </a>
              <a className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-pearl backdrop-blur-xl transition hover:border-gold/40 hover:bg-white/10" href="#events">
                Upcoming Events
              </a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: Play, label: "Live Streams", href: "#sermons" },
                { icon: CalendarDays, label: "Events", href: "#events" },
                { icon: Users, label: "Pastors", href: "#pastors" },
                { icon: Search, label: "Search", href: "#search" }
              ].map(({ icon: Icon, label, href }) => (
                <a key={label} href={href} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:border-gold/40">
                  <Icon className="h-5 w-5 text-gold" />
                  <p className="mt-3 text-sm text-mist/80">{label}</p>
                </a>
              ))}
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
          </div>
        </div>
      </section>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
