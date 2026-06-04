import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { SearchBox } from "../components/SearchBox";

type SearchResult = {
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
  score: number;
};

type SearchResponse = {
  results: SearchResult[];
  groups: Record<string, SearchResult[]>;
};

const groupLabels: Record<string, string> = {
  pages: "Pages",
  events: "Events",
  pastors: "Pastors",
  sermons: "Sermons",
  ministries: "Ministries",
  media: "Media"
};

export function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["public", "search", query],
    queryFn: () => apiFetch<SearchResponse>(`/api/public/search?q=${encodeURIComponent(query)}&limit=12`),
    enabled: query.length > 0,
    staleTime: 0
  });

  const groups = ["pages", "events", "pastors", "sermons", "ministries", "media"]
    .map((key) => ({ key, items: data?.groups?.[key] ?? [] }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-gold/80">Search</p>
        <h1 className="mt-4 text-4xl font-semibold text-pearl md:text-6xl">Find content across the church site</h1>
        <p className="mt-4 text-base leading-7 text-mist/80">
          Search pages, events, pastors, sermons, ministries, and media with live suggestions and grouped results.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <SearchBox initialValue={query} placeholder="Search pastors, services, events, ministries..." className="relative" />
      </div>

      {query ? (
        <div className="mt-10">
          {isLoading ? <p className="text-sm text-white/50">Searching...</p> : null}
          {!isLoading && !data?.results.length ? <p className="text-sm text-white/50">No results found for "{query}".</p> : null}

          <div className="mt-8 grid gap-6">
            {groups.map((group) => (
              <section key={group.key} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold text-pearl">{groupLabels[group.key] ?? group.key}</h2>
                  <span className="text-sm text-white/45">{group.items.length} results</span>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {group.items.map((item) => (
                    <a
                      key={`${group.key}-${item.href}-${item.title}`}
                      href={item.href}
                      className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:border-gold/40 hover:bg-white/7"
                    >
                      <p className="text-[11px] uppercase tracking-[0.3em] text-gold/80">{item.type}</p>
                      <h3 className="mt-2 text-lg font-semibold text-pearl">{item.title}</h3>
                      {item.subtitle ? <p className="mt-1 text-sm text-white/65">{item.subtitle}</p> : null}
                      {item.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">{item.description}</p> : null}
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Try it</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
            Start typing a pastor name, event, sermon, ministry, or page. Suggestions appear instantly, and pressing Enter will search the whole site.
          </p>
        </div>
      )}
    </div>
  );
}
