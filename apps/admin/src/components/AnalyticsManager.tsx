import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

type Summary = {
  visitors: number;
  pastors: number;
  sermons: number;
  events: number;
  videos: number;
  images: number;
};

type AnalyticsEvent = {
  id: string;
  type: string;
  path?: string;
  searchTerm?: string;
  createdAt: string;
};

export function AnalyticsManager() {
  const summary = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => apiFetch<Summary>("/api/analytics/summary")
  });

  const events = useQuery({
    queryKey: ["analytics-events"],
    queryFn: () => apiFetch<AnalyticsEvent[]>("/api/analytics")
  });

  const cards = [
    ["Total Visitors", summary.data?.visitors ?? 0],
    ["Total Pastors", summary.data?.pastors ?? 0],
    ["Total Sermons", summary.data?.sermons ?? 0],
    ["Total Events", summary.data?.events ?? 0],
    ["Total Videos", summary.data?.videos ?? 0],
    ["Total Images", summary.data?.images ?? 0]
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Analytics</p>
        <h2 className="mt-3 text-3xl font-semibold">Visitors and Usage</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label as string} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">{label as string}</p>
            <p className="mt-3 text-3xl font-semibold text-gold">{value as number}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <p className="font-semibold">Recent Events</p>
        <div className="mt-4 grid gap-3">
          {(events.data ?? []).slice(0, 12).map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="uppercase tracking-[0.2em] text-gold/80">{item.type}</span>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              {item.path ? <p className="mt-2">Path: {item.path}</p> : null}
              {item.searchTerm ? <p>Search: {item.searchTerm}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

