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
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <img
                src="https://res.cloudinary.com/dhqc0n23k/image/upload/v1781002190/methodist_logo_syy6ca.png"
                className="h-12 w-12"
                alt="logo"
              />
            </Link>
            <div>
              <h1 className="font-bold text-cream">{t("Methodist Tamil Church")}</h1>
              <p className="text-xs text-cream/80">{t("Padikuppam")}</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <ul className="hidden gap-8 lg:flex">
              {links.map((link) => (
                <li key={link.id}>
                  <a href={link.href} className={linkClass(link.id)}>
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>

            <div className="hidden items-center overflow-hidden rounded-full border border-white/20 lg:flex">
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
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-2xl text-cream transition-transform duration-300 hover:scale-110 lg:hidden"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 py-4 lg:hidden">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-3 transition-colors duration-300 ${
                  active === link.id ? "font-bold text-cream" : "text-cream/80"
                }`}
              >
                {t(link.key)}
              </a>
            ))}

            <div className="mt-4 flex w-fit overflow-hidden rounded-full border border-white/20">
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
          </div>
        )}
      </div>
    </nav>
  );
}
