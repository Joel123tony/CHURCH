import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaBars,
  FaCalendarAlt,
  FaClock,
  FaGlobe,
  FaHome,
  FaPhotoVideo,
  FaPrayingHands,
  FaSignOutAlt,
  FaTimes,
  FaUserShield,
  FaUsers,
  FaComments,
} from "react-icons/fa";

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || token === "null" || token === "undefined") {
      navigate("/admin/login", { replace: true });
      return;
    }

    const storedUserRaw = localStorage.getItem("user");

    try {
      const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
      setUser(storedUser || { name: "Administrator" });
    } catch {
      setUser({ name: "Administrator" });
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login", { replace: true });
  };

  const navSections = [
    {
      title: "MAIN",
      links: [
        { to: "/admin/dashboard", label: "Dashboard", icon: FaHome, end: true },
      ],
    },
    {
      title: "CONTENT",
      links: [
        { to: "/admin/pastors", label: "Pastors", icon: FaUsers },
        { to: "/admin/events", label: "Events", icon: FaCalendarAlt },
        { to: "/admin/gallery", label: "Gallery", icon: FaPhotoVideo },
        { to: "/admin/prayer-requests", label: "Prayer Requests", icon: FaPrayingHands },
        { to: "/admin/pastor-message", label: "Pastor's Message", icon: FaComments },
      ],
    },
    {
      title: "CMS",
      links: [
        { to: "/admin/web-editor", label: "Web Editor", icon: FaGlobe },
      ],
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#f4efe7] text-slate-900">
      {/* Mobile Drawer Overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col overflow-hidden
          bg-gradient-to-b from-[#520a1a] via-[#5d1020] to-[#430816]
          shadow-xl transition-transform duration-300 ease-in-out
          ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Compact Admin Card */}
        <div className="border-b border-white/10 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFBF04]/15 text-[#EFBF04] ring-1 ring-[#EFBF04]/30 shadow-inner">
                <FaUserShield className="text-lg" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-[#EFBF04] leading-tight">MTC Admin</h1>
                <p className="truncate text-[11px] text-white/70">{user?.name || "Administrator"}</p>
              </div>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition md:hidden"
              aria-label="Close menu"
            >
              <FaTimes />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-1.5 rounded-lg bg-black/20 px-3 py-2 text-white/80 border border-white/5">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-xs text-[#EFBF04]" />
              <span className="text-xs font-medium tracking-wide">
                {currentTime.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="text-xs text-[#EFBF04]" />
              <span className="text-xs font-medium tracking-wide">
                {currentTime.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 admin-scrollbar">
          <div className="flex flex-col gap-6">
            {navSections.map((section) => (
              <div key={section.title} className="flex flex-col gap-1.5">
                <h2 className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                  {section.title}
                </h2>
                <div className="flex flex-col gap-1">
                  {section.links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-[#ee0039] text-white shadow-md"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      <link.icon className={`text-[15px] transition-transform duration-200 group-hover:scale-110 ${
                        window.location.pathname === link.to ? "text-white" : "text-white/60"
                      }`} />
                      <span>{link.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={logout}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <FaSignOutAlt className="text-[15px] transition-transform duration-200 group-hover:scale-110" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`min-h-screen flex-1 flex flex-col transition-[filter,transform] duration-300 md:ml-[260px] ${
          menuOpen ? "pointer-events-none select-none blur-[2px] md:pointer-events-auto md:blur-0" : ""
        }`}
      >
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[#54091b] transition hover:bg-slate-200 active:scale-95"
              aria-label="Open menu"
            >
              <FaBars className="text-lg" />
            </button>
            <h1 className="text-base font-bold text-[#54091b]">MTC Admin</h1>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div key={location.pathname} className="animate-admin-page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}
