import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("home");
  const { language, setLanguage, t } = useLanguage();

  const links = useMemo(
    () => [
      { key: "Home", href: "#hero", id: "hero" },
      { key: "History", href: "#church-history", id: "church-history" },
      { key: "Events", href: "#events", id: "events" },
      { key: "Gallery", href: "#gallery", id: "gallery" },
      { key: "Pastor", href: "#pastor", id: "pastor" },
      { key: "Message", href: "#pastor-message", id: "pastor-message" },
      { key: "Books", href: "#books", id: "books" },
      { key: "Contact", href: "#contact", id: "contact" },
    ],
    []
  );

  useEffect(() => {
    const sections = links.map((l) => document.getElementById(l.id));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { threshold: 0.6 }
    );

    sections.forEach((sec) => {
      if (sec) observer.observe(sec);
    });

    return () => observer.disconnect();
  }, [links]);

  const linkClass = (id) =>
    `transition-colors duration-300 ${
      active === id ? "text-cream font-bold" : "text-cream/80 hover:text-cream"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-primary text-cream shadow-lg transition-colors duration-500 ease-out">
      <div className="container-custom">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Logo Area - Left Aligned */}
          <div className="flex shrink-0 items-center gap-3">
            <Link to="/admin" className="shrink-0">
              <img
                src="https://res.cloudinary.com/dhqc0n23k/image/upload/v1781002190/methodist_logo_syy6ca.png"
                className="h-12 w-12 shrink-0"
                alt="logo"
              />
            </Link>
            <div className="whitespace-nowrap">
              <h1 className="font-bold text-cream">{t("Methodist Tamil Church")}</h1>
              <p className="text-xs text-cream/80">{t("Padikuppam")}</p>
            </div>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden flex-1 items-center justify-center lg:flex">
            <ul
              className={`flex items-center justify-center ${
                language === "ta" ? "gap-3 xl:gap-5 text-[15px]" : "gap-6 xl:gap-8 text-base"
              }`}
            >
              {links.map((link) => (
                <li key={link.id} className="whitespace-nowrap">
                  <a href={link.href} className={linkClass(link.id)}>
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Aligned Area: Desktop Language Switch & Mobile Toggle */}
          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden shrink-0 items-center overflow-hidden rounded-full border border-white/20 lg:flex">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-4 py-2 text-sm transition-colors duration-300 ${
                  language === "en"
                    ? "bg-cream text-primary"
                    : "text-cream hover:bg-white/10"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("ta")}
                className={`px-4 py-2 text-sm transition-colors duration-300 ${
                  language === "ta"
                    ? "bg-cream text-primary"
                    : "text-cream hover:bg-white/10"
                }`}
              >
                தமிழ்
              </button>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="shrink-0 text-2xl text-cream transition-transform duration-300 hover:scale-110 lg:hidden"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="border-t border-white/10 py-4 lg:hidden">
            <div className="flex flex-col">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-3 transition-colors duration-300 ${
                    active === link.id ? "font-bold text-cream" : "text-cream/80"
                  } ${language === "ta" ? "text-[15px]" : "text-base"}`}
                >
                  {t(link.key)}
                </a>
              ))}
            </div>

            <div className="mt-4 flex w-fit overflow-hidden rounded-full border border-white/20">
              <button
                type="button"
                onClick={() => {
                  setLanguage("en");
                  setMenuOpen(false);
                }}
                className={`px-4 py-2 text-sm transition-colors duration-300 ${
                  language === "en"
                    ? "bg-cream text-primary"
                    : "text-cream hover:bg-white/10"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage("ta");
                  setMenuOpen(false);
                }}
                className={`px-4 py-2 text-sm transition-colors duration-300 ${
                  language === "ta"
                    ? "bg-cream text-primary"
                    : "text-cream hover:bg-white/10"
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
