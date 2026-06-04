import { Outlet, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search, PlayCircle } from "lucide-react";
import { apiFetch } from "../lib/api";

type SiteSettings = {
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
  footer?: {
    text?: string;
    copyright?: string;
  };
  socialLinks?: Array<{ label: string; href: string }>;
};

const nav = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Mission", href: "#mission" },
  { label: "Vision", href: "#vision" },
  { label: "Ministries", href: "#ministries" },
  { label: "Events", href: "#events" },
  { label: "Gallery", href: "#gallery" },
  { label: "Pastors", href: "#pastors" },
  { label: "Contact", href: "#contact" },
  { label: "Search", href: "#search" }
];

export function PublicLayout() {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => apiFetch<SiteSettings>("/api/public/site"),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15_000
  });

  const site = data ?? {
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
    footer: {
      text: "Worship with us in Tamil and English at Padikuppam.",
      copyright: "Methodist Tamil Church, Padikuppam"
    },
    socialLinks: []
  };
  const socialLinks = [
    site.youtubeChannel ? { label: "YouTube", href: site.youtubeChannel } : null,
    site.facebookUrl ? { label: "Facebook", href: site.facebookUrl } : null,
    site.instagramUrl ? { label: "Instagram", href: site.instagramUrl } : null,
    ...(site.socialLinks ?? [])
  ].filter((item): item is { label: string; href: string } => Boolean(item));

  return (
    <div className="min-h-screen text-pearl">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-gold/30 bg-white/5 shadow-glow">
              <PlayCircle className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-gold/80">{site.shortName ?? "Church"}</p>
              <p className="text-lg font-semibold">{site.churchName}</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {nav.map((item) => (
              <a key={item.label} href={item.href} className="text-sm text-mist/90 transition hover:text-gold">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-white/10 bg-white/5 p-3 text-mist transition hover:border-gold/40 hover:bg-white/10 lg:hidden">
              <Menu className="h-4 w-4" />
            </button>
            <a href="#search" className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-mist transition hover:border-gold/40 hover:bg-white/10 md:flex">
              <Search className="h-4 w-4" />
              Search
            </a>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold/80">{site.shortName ?? site.churchName}</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-mist/80">
              {site.footer?.text ?? "Worship with us in Tamil and English at Padikuppam."}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-pearl">Quick Links</p>
            <div className="mt-4 grid gap-2 text-sm text-mist/80">
              {nav.map((item) => (
                <a key={item.label} href={item.href} className="transition hover:text-gold">
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-pearl">Location</p>
            <p className="mt-4 text-sm leading-6 text-mist/80">{site.address ?? site.fullName ?? site.churchName}</p>
            <p className="mt-3 text-sm leading-6 text-mist/70">
              {site.primaryLanguage ? `Primary: ${site.primaryLanguage}` : null}
              {site.primaryLanguage && site.secondaryLanguage ? <br /> : null}
              {site.secondaryLanguage ? `Secondary: ${site.secondaryLanguage}` : null}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {socialLinks.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-mist/80 transition hover:border-gold/40 hover:text-gold">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
