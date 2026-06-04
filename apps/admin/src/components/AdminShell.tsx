import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Image, CalendarDays, Church, Settings, Youtube, BarChart3 } from "lucide-react";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Page Builder", href: "/page-builder", icon: FileText },
  { label: "Media Manager", href: "/media-manager", icon: Image },
  { label: "Events", href: "/event-manager", icon: CalendarDays },
  { label: "Pastors", href: "/pastor-manager", icon: Church },
  { label: "Theme", href: "/theme-manager", icon: Settings },
  { label: "YouTube", href: "/youtube-manager", icon: Youtube },
  { label: "Analytics", href: "/analytics", icon: BarChart3 }
];

export function AdminShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#08111e] text-pearl">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-black/20 px-5 py-6 backdrop-blur-xl">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.4em] text-gold/80">Admin</p>
            <h1 className="mt-2 text-2xl font-semibold">Methodist Tamil Church</h1>
            <p className="mt-1 text-sm text-white/60">Private dashboard only</p>
          </div>
          <nav className="grid gap-2">
            {nav.map((item) => {
              const active = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    active ? "bg-gold text-ink" : "bg-white/5 text-pearl hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
