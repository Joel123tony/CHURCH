import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("home");
  const { language, setLanguage, t } = useLanguage();

  const links = [
    { key: "nav.home", href: "#home", id: "home" },
    { key: "nav.history", href: "#history", id: "history" },
    { key: "nav.events", href: "#events", id: "events" },
    { key: "nav.gallery", href: "#gallery", id: "gallery" },
    { key: "nav.pastor", href: "#pastor", id: "pastor" },
    { key: "nav.contact", href: "#contact", id: "contact" },
  ];

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
  }, []);

  const linkClass = (id) =>
    `transition ${
      active === id
        ? "text-secondary font-bold"
        : "text-primary hover:text-secondary"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-light border-b shadow-sm">
      <div className="container-custom">
        <div className="h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <img
                src="https://res.cloudinary.com/dhqc0n23k/image/upload/v1781002190/methodist_logo_syy6ca.png"
                className="h-12 w-12"
                alt="logo"
              />
            </Link>
            <div>
              <h1 className="text-primary font-bold">Methodist Tamil Church</h1>
              <p className="text-xs text-gray-600">Padikuppam</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <ul className="hidden lg:flex gap-8">
              {links.map((link) => (
                <li key={link.id}>
                  <a href={link.href} className={linkClass(link.id)}>
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>

            <div className="hidden lg:flex items-center border border-primary rounded-full overflow-hidden">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-4 py-2 text-sm transition ${
                  language === "en"
                    ? "bg-primary text-white"
                    : "text-primary hover:bg-gray-100"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("ta")}
                className={`px-4 py-2 text-sm transition ${
                  language === "ta"
                    ? "bg-primary text-white"
                    : "text-primary hover:bg-gray-100"
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-2xl"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden py-4 border-t">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-3 ${
                  active === link.id
                    ? "text-secondary font-bold"
                    : "text-primary"
                }`}
              >
                {t(link.key)}
              </a>
            ))}

            <div className="flex mt-4 border border-primary rounded-full overflow-hidden w-fit">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-4 py-2 text-sm transition ${
                  language === "en"
                    ? "bg-primary text-white"
                    : "text-primary hover:bg-gray-100"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("ta")}
                className={`px-4 py-2 text-sm transition ${
                  language === "ta"
                    ? "bg-primary text-white"
                    : "text-primary hover:bg-gray-100"
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
