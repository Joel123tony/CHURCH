import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Play, Users } from "lucide-react";
import { apiFetch } from "../lib/api";
import { SectionRenderer, type SectionData } from "../components/SectionRenderer";

export function HomePage() {
  const { data } = useQuery({
    queryKey: ["home"],
    queryFn: () => apiFetch<{ live?: { isLive: boolean; title?: string; viewerCount?: number }; sections?: SectionData[] }>("/api/public/home")
  });

  const fallbackSections: SectionData[] = [
    {
      id: "welcome",
      subtitle: "Welcome Home",
      title: "A premium church experience for worship, community, and outreach.",
      description:
        "This scaffold is built to support live streams, sermons, events, pastors, media galleries, and a flexible content model that staff can update without touching code.",
      blocks: [
        {
          type: "text",
          heading: "Sunday Gathering",
          content: "Join our worship service every Sunday with live stream support and sermon archives that update automatically from YouTube.",
          bibleVerse: "Where two or three gather in my name, there am I with them."
        },
        {
          type: "card",
          title: "Member Care",
          description: "Prayer requests, event registration, and follow-up flows for church staff."
        }
      ]
    }
  ];

  const sections = data?.sections?.length ? data.sections : fallbackSections;

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-radial" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-28">
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Grace House Church</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-pearl md:text-7xl">
              Elegant, spiritual, modern church platform design.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-mist/78 md:text-lg">
              Built to automatically surface live broadcasts, sermon archives, events, pastors, and a polished administrative experience for non-technical church teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:scale-[1.02]" href="/sermons">
                Watch Sermons <ArrowRight className="h-4 w-4" />
              </a>
              <a className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-pearl backdrop-blur-xl transition hover:border-gold/40 hover:bg-white/10" href="/events">
                Upcoming Events
              </a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              {[
                { icon: Play, label: "Live Streams" },
                { icon: CalendarDays, label: "Events" },
                { icon: Users, label: "Pastors" }
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                  <Icon className="h-5 w-5 text-gold" />
                  <p className="mt-3 text-sm text-mist/80">{label}</p>
                </div>
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
                  <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300">LIVE</span>
                </div>
                <div className="grid gap-4 p-4">
                  <div className="aspect-video rounded-2xl bg-[linear-gradient(135deg,rgba(215,180,106,0.22),rgba(255,255,255,0.02))]" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-pearl">Sunday Worship Live</p>
                      <p className="text-xs text-mist/70">
                        {data?.live?.isLive ? `${data.live.viewerCount ?? 0} watching now` : "Currently offline, sermon archive ready"}
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
