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

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiFetch<Summary>("/api/admin/dashboard")
  });

  const stats = [
    ["Total Visitors", data?.visitors ?? 0],
    ["Total Pastors", data?.pastors ?? 0],
    ["Total Sermons", data?.sermons ?? 0],
    ["Total Events", data?.events ?? 0],
    ["Total Videos", data?.videos ?? 0],
    ["Total Images", data?.images ?? 0]
  ];

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Overview</p>
          <h2 className="mt-2 text-4xl font-semibold">Dashboard</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">Updates publish only after approval</div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-sm text-white/60">{label as string}</p>
            <p className="mt-3 text-3xl font-semibold text-gold">{value as number}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="font-semibold">Recent Activity</p>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            <p>New sermon synced from YouTube</p>
            <p>Event published to homepage</p>
            <p>Pastor timeline reordered</p>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="font-semibold">Content Control</p>
          <p className="mt-4 text-sm leading-6 text-white/70">
            This dashboard is set up for page building, media management, navigation editing, theme updates, analytics, and moderation workflows.
          </p>
        </div>
      </div>
    </div>
  );
}
