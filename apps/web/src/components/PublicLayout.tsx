import { Outlet, Link } from "react-router-dom";
import { Menu, Search, PlayCircle } from "lucide-react";

const nav = ["Home", "About", "Ministries", "Events", "Gallery", "Pastors", "Contact", "Search"];

export function PublicLayout() {
  return (
    <div className="min-h-screen text-pearl">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-gold/30 bg-white/5 shadow-glow">
              <PlayCircle className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-gold/80">Church</p>
              <p className="text-lg font-semibold">Grace House</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {nav.map((item) => (
              <Link key={item} to={item === "Home" ? "/" : `/${item.toLowerCase()}`} className="text-sm text-mist/90 transition hover:text-gold">
                {item}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-white/10 bg-white/5 p-3 text-mist transition hover:border-gold/40 hover:bg-white/10 lg:hidden">
              <Menu className="h-4 w-4" />
            </button>
            <button className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-mist transition hover:border-gold/40 hover:bg-white/10 md:flex">
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold/80">Grace House</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-mist/80">
              A warm, modern church experience built for worship, sermons, events, and community care.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-pearl">Quick Links</p>
            <div className="mt-4 grid gap-2 text-sm text-mist/80">
              {nav.map((item) => (
                <Link key={item} to={item === "Home" ? "/" : `/${item.toLowerCase()}`} className="transition hover:text-gold">
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-pearl">Sunday Service</p>
            <p className="mt-4 text-sm leading-6 text-mist/80">Join us every Sunday at 9:00 AM and 11:30 AM.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
