import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { SectionRenderer, type SectionData } from "../components/SectionRenderer";

const pages: Record<string, { title: string; description: string; sections: SectionData[] }> = {
  about: {
    title: "About Our Church",
    description: "A place for worship, discipleship, and service.",
    sections: [
      { id: "about-hero", title: "Rooted in Faith", subtitle: "About", description: "This page is wired to render from backend content when connected." }
    ]
  },
  ministries: {
    title: "Ministries",
    description: "Explore ministries, small groups, youth, worship, and outreach.",
    sections: [{ id: "ministries", title: "Ministry Teams", subtitle: "Ministries", description: "Flexible ministry cards and content blocks." }]
  },
  events: {
    title: "Events",
    description: "Upcoming gatherings, conferences, and special services.",
    sections: [{ id: "events", title: "Event Calendar", subtitle: "Events", description: "Staff can create and publish events from the dashboard." }]
  },
  gallery: {
    title: "Gallery",
    description: "Photos and videos from worship, outreach, and history.",
    sections: [{ id: "gallery", title: "Media Gallery", subtitle: "Gallery", description: "Supports masonry, lightbox, fullscreen, and swipe." }]
  },
  pastors: {
    title: "Pastors",
    description: "Meet the leadership timeline and individual pastor pages.",
    sections: [{ id: "pastors", title: "Leadership Timeline", subtitle: "Pastors", description: "Animated and responsive timeline design." }]
  },
  contact: {
    title: "Contact",
    description: "Get in touch with the church office.",
    sections: [{ id: "contact", title: "Connect With Us", subtitle: "Contact", description: "Forms and prayer requests can be managed in the admin dashboard." }]
  },
  sermons: {
    title: "Sermons",
    description: "Recent sermons, featured sermons, and live archive content.",
    sections: [{ id: "sermons", title: "Recent Sermons", subtitle: "Sermons", description: "Auto-updates when the YouTube channel publishes new sermons." }]
  },
  search: {
    title: "Search",
    description: "Search sermons, pastors, events, galleries, ministries, and pages.",
    sections: [{ id: "search", title: "Global Search", subtitle: "Search", description: "Search history is stored locally for faster repeat queries." }]
  },
  "pastor-detail": {
    title: "Pastor Profile",
    description: "Detailed pastor page with biography, media, and sermons.",
    sections: [{ id: "pastor-detail", title: "Pastor Profile", subtitle: "Pastor", description: "Dynamic route placeholder for /pastors/:slug." }]
  },
  "sermon-detail": {
    title: "Sermon Detail",
    description: "Single sermon page with video, notes, and related content.",
    sections: [{ id: "sermon-detail", title: "Sermon Detail", subtitle: "Sermon", description: "Dynamic route placeholder for /sermons/:slug." }]
  }
};

export function PageView({ slug }: { slug: string }) {
  const params = useParams();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [results, setResults] = useState<Array<{ type: string; item: Record<string, unknown> }>>([]);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const key = useMemo(() => (slug === "pastor-detail" ? "pastor-detail" : slug), [slug]);
  const page = pages[key] ?? pages.about;

  useEffect(() => {
    if (slug !== "search") {
      return;
    }

    const stored = localStorage.getItem("church-search-history");
    setHistory(stored ? (JSON.parse(stored) as string[]) : []);
  }, [slug]);

  useEffect(() => {
    if (key === "pastor-detail" && params.slug) {
      apiFetch<{ pastor: Record<string, unknown>; sermons: Array<Record<string, unknown>> }>(`/api/public/pastors/${params.slug}`)
        .then((payload) => setDetail({ ...payload.pastor, sermons: payload.sermons }))
        .catch(() => setDetail(null));
      return;
    }

    if (key === "sermon-detail" && params.slug) {
      apiFetch<Record<string, unknown>>(`/api/public/sermons/${params.slug}`)
        .then(setDetail)
        .catch(() => setDetail(null));
      return;
    }

    setDetail(null);
  }, [key, params.slug]);

  useEffect(() => {
    if (slug !== "search" || !query.trim()) {
      return;
    }

    const handle = window.setTimeout(async () => {
      const response = await apiFetch<{ results: Array<{ type: string; item: Record<string, unknown> }> }>(`/api/public/search?q=${encodeURIComponent(query.trim())}`);
      setResults(response.results);

      setHistory((current) => {
        const nextHistory = [query.trim(), ...current.filter((entry) => entry !== query.trim())].slice(0, 8);
        localStorage.setItem("church-search-history", JSON.stringify(nextHistory));
        return nextHistory;
      });
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query, slug]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-gold/80">/{location.pathname.replace(/^\//, "")}</p>
        <h1 className="mt-4 text-4xl font-semibold text-pearl md:text-6xl">{page.title}</h1>
        <p className="mt-4 text-base leading-7 text-mist/80">{page.description}</p>
        {params.slug ? <p className="mt-3 text-sm text-gold/80">Slug: {params.slug}</p> : null}
      </div>
      {detail ? (
        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-gold/80">Dynamic Content</p>
          <pre className="mt-4 overflow-x-auto text-xs text-white/70">{JSON.stringify(detail, null, 2)}</pre>
        </div>
      ) : null}
      {slug === "search" ? (
        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <label className="block text-sm font-medium text-pearl">Search the church site</label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sermons, events, pastors, pages, galleries, ministries..."
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-pearl outline-none placeholder:text-white/30"
          />
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={`${result.type}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-gold/80">{result.type}</p>
                  <pre className="mt-2 overflow-x-auto text-xs text-white/70">{JSON.stringify(result.item, null, 2)}</pre>
                </div>
              ))}
              {!results.length ? <p className="text-sm text-white/50">Search results will appear here.</p> : null}
            </div>
            <aside className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold">Recent Searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {history.length ? history.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:border-gold/40 hover:text-gold"
                  >
                    {term}
                  </button>
                )) : <p className="text-sm text-white/50">Nothing saved yet.</p>}
              </div>
            </aside>
          </div>
        </div>
      ) : null}
      <div className="mt-10">
        {page.sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
