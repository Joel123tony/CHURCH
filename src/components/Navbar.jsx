import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import methodistLogo from "../assets/methodist-logo.png";
import { ChevronDown, X, Menu } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const links = useMemo(
    () => [
      { key: "Home", href: "/#hero", id: "hero" },
      { key: "History", href: "/#history", id: "history" },
      { key: "Events", href: "/#events", id: "events" },
      { key: "Gallery", href: "/#gallery", id: "gallery" },
      { key: "Pastor", href: "/#pastor", id: "pastor" },
      { key: "Message", href: "/#pastor-message", id: "pastor-message" },
      { key: "Contact", href: "/#contact", id: "contact" },
    ],
    []
  );

  const resources = [
    { key: "Bible", href: "/bible" },
    { key: "Christian Songs", href: "/songs" },
    { key: "Books & Pamphlets", href: "/books" },
  ];

  // Intersection observer for active sections
  useEffect(() => {
    if (pathname !== "/") return;

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
  }, [links, pathname]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setResourcesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Cross-page hash navigation helper
  const handleNavClick = (e, href, id) => {
    e.preventDefault();
    setMenuOpen(false);

    const targetHash = href.replace("/", "");
    if (pathname === "/" && window.location.hash === targetHash) {
      // Already on the same page and same hash. Just force scroll.
      const el = document.getElementById(id);
      if (el) {
        const yOffset = -80; 
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    } else {
      navigate(href);
    }
  };

  const linkClass = (id) =>
    `transition-colors duration-300 ${
      active === id ? "text-cream font-bold" : "text-cream/80 hover:text-cream"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-primary text-cream shadow-lg transition-colors duration-500 ease-out">
      <div className="container-custom">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Logo Area */}
          <div className="flex shrink-0 items-center gap-3">
            <Link to="/admin" className="shrink-0">
              <img
                src={methodistLogo}
                className="h-12 w-12 shrink-0 object-contain"
                alt="Methodist Logo"
              />
            </Link>
            <div className="whitespace-nowrap">
              <Link to="/">
                <h1 className="font-bold text-cream">{t("Methodist Tamil Church")}</h1>
                <p className="text-xs text-cream/80">{t("Padikuppam")}</p>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden flex-1 items-center justify-center lg:flex">
            <ul
              className={`flex items-center justify-center ${
                language === "ta" ? "gap-3 xl:gap-5 text-[15px]" : "gap-6 xl:gap-8 text-base"
              }`}
            >
              {links.slice(0, 6).map((link) => (
                <li key={link.id} className="whitespace-nowrap">
                  <a href={link.href} onClick={(e) => handleNavClick(e, link.href, link.id)} className={linkClass(link.id)}>
                    {t(link.key)}
                  </a>
                </li>
              ))}

              {/* Resources Dropdown */}
              <li className="relative whitespace-nowrap" ref={dropdownRef}>
                <button
                  onClick={() => setResourcesOpen(!resourcesOpen)}
                  className={`flex items-center gap-1 transition-colors duration-300 ${
                    pathname.match(/^\/(bible|songs|books)/)
                      ? "text-cream font-bold"
                      : "text-cream/80 hover:text-cream"
                  }`}
                >
                  {t("Resources")} <ChevronDown size={16} className={`transition-transform ${resourcesOpen ? "rotate-180" : ""}`} />
                </button>
                
                {resourcesOpen && (
                  <div className="absolute left-0 mt-4 w-52 rounded-xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                      {resources.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setResourcesOpen(false)}
                          className="block px-4 py-3 text-sm text-[#54091b] font-medium hover:bg-[#F4EFE7] hover:text-[#54091b] transition-colors"
                        >
                          {t(item.key)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>

              <li key={links[6].id} className="whitespace-nowrap">
                <a href={links[6].href} onClick={(e) => handleNavClick(e, links[6].href, links[6].id)} className={linkClass(links[6].id)}>
                  {t(links[6].key)}
                </a>
              </li>
            </ul>
          </div>

          {/* Desktop Language & Mobile Hamburger */}
          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden shrink-0 items-center overflow-hidden rounded-full border border-white/20 lg:flex">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${
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
                className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${
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
              className="shrink-0 text-cream p-2 transition-transform duration-300 hover:scale-110 active:scale-95 lg:hidden"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-[70] w-[280px] sm:w-[320px] bg-primary border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/20">
          <span className="font-bold text-cream text-lg">{t("Menu")}</span>
          <button onClick={() => setMenuOpen(false)} className="text-cream hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors active:scale-95">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="flex flex-col gap-2">
            {links.slice(0, 6).map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href, link.id)}
                className={`block py-3.5 px-4 rounded-xl font-medium transition-colors duration-300 ${
                  active === link.id ? "bg-white/10 text-white" : "text-cream/80 hover:bg-white/5 hover:text-white"
                } ${language === "ta" ? "text-[15px]" : "text-base"}`}
              >
                {t(link.key)}
              </a>
            ))}

            {/* Mobile Resources Submenu */}
            <div className="py-1">
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                className={`flex w-full items-center justify-between py-3.5 px-4 rounded-xl font-medium transition-colors duration-300 ${
                  pathname.match(/^\/(bible|songs|books)/)
                    ? "bg-white/10 text-white"
                    : "text-cream/80 hover:bg-white/5 hover:text-white"
                } ${language === "ta" ? "text-[15px]" : "text-base"}`}
              >
                {t("Resources")} <ChevronDown size={18} className={`transition-transform duration-300 ${resourcesOpen ? "rotate-180" : ""}`} />
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${resourcesOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pl-6 pr-2 py-2 flex flex-col gap-1 border-l-2 border-white/10 ml-6 mt-1 mb-2">
                  {resources.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => {
                        setResourcesOpen(false);
                        setMenuOpen(false);
                      }}
                      className={`block py-2.5 px-3 rounded-lg text-cream/80 font-medium hover:text-white hover:bg-white/5 transition-colors text-sm ${
                        pathname === item.href ? "text-white bg-white/5" : ""
                      }`}
                    >
                      {t(item.key)}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <a
              key={links[6].id}
              href={links[6].href}
              onClick={(e) => handleNavClick(e, links[6].href, links[6].id)}
              className={`block py-3.5 px-4 rounded-xl font-medium transition-colors duration-300 ${
                active === links[6].id ? "bg-white/10 text-white" : "text-cream/80 hover:bg-white/5 hover:text-white"
              } ${language === "ta" ? "text-[15px]" : "text-base"}`}
            >
              {t(links[6].key)}
            </a>
          </div>
        </div>

        {/* Mobile Language Switcher */}
        <div className="p-5 border-t border-white/10 bg-black/20">
          <div className="flex w-full overflow-hidden rounded-xl border border-white/20">
            <button
              type="button"
              onClick={() => {
                setLanguage("en");
                setMenuOpen(false);
              }}
              className={`flex-1 py-3 text-sm font-bold transition-colors duration-300 ${
                language === "en"
                  ? "bg-cream text-primary"
                  : "text-cream hover:bg-white/10"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage("ta");
                setMenuOpen(false);
              }}
              className={`flex-1 py-3 text-sm font-bold transition-colors duration-300 ${
                language === "ta"
                  ? "bg-cream text-primary"
                  : "text-cream hover:bg-white/10"
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
