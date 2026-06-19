import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaCalendarAlt,
  FaClock,
  FaHome,
  FaPhotoVideo,
  FaPrayingHands,
  FaSignOutAlt,
  FaTimes,
  FaUserShield,
  FaUsers,
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

  const links = useMemo(
    () => [
      { to: "/admin/dashboard", label: "Dashboard", end: true, icon: FaHome },
      { to: "/admin/pastors", label: "Pastors", icon: FaUsers },
      { to: "/admin/events", label: "Events", icon: FaCalendarAlt },
      { to: "/admin/gallery", label: "Gallery", icon: FaPhotoVideo },
      {
        to: "/admin/prayer-requests",
        label: "Prayer Requests",
        icon: FaPrayingHands,
      },
    ],
    []
  );

  return (
    <div className="flex min-h-screen bg-[#f4efe7] text-slate-900">
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-full w-[82vw] max-w-[19rem] flex-col overflow-hidden
          bg-gradient-to-b from-[#520a1a] via-[#5d1020] to-[#430816]
          shadow-2xl shadow-black/25
          transform transition-transform duration-300 ease-out
          ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="border-b border-white/10 p-5 sm:p-6">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lg shadow-black/10">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFBF04]/15 text-[#EFBF04] ring-1 ring-[#EFBF04]/20">
                <FaUserShield className="text-xl" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#EFBF04] sm:text-[1.75rem]">
                  MTC Admin
                </h1>
                <p className="mt-1 truncate text-sm text-white/75">
                  {user?.name || "Administrator"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:hidden"
                aria-label="Close menu"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex min-h-[5.5rem] items-center gap-3 rounded-2xl bg-black/10 px-3 py-3 text-white sm:px-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#EFBF04]/15 text-[#EFBF04] sm:h-12 sm:w-12">
                  <FaCalendarAlt className="text-base sm:text-lg" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">
                    Date
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5 sm:text-[15px]">
                    {currentTime.toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex min-h-[5.5rem] items-center gap-3 rounded-2xl bg-black/10 px-3 py-3 text-white sm:px-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#EFBF04]/15 text-[#EFBF04] sm:h-12 sm:w-12">
                  <FaClock className="text-base sm:text-lg" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">
                    Time
                  </p>
                  <p className="mt-1 text-base font-semibold leading-5 sm:text-[1.1rem]">
                    {currentTime.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav className="admin-scrollbar flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[#ee0039] text-white shadow-lg shadow-black/15"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#EFBF04] transition group-hover:bg-white/15">
                  <link.icon />
                </span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={logout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ee0039] py-3 font-semibold text-white transition hover:bg-red-700"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      <div
        className={`min-h-screen flex-1 transition-[filter,transform] duration-300 md:ml-72 ${
          menuOpen ? "pointer-events-none select-none blur-[1px] md:pointer-events-auto md:blur-0" : ""
        }`}
      >
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur md:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-[#54091b] transition hover:bg-slate-200"
            aria-label="Open menu"
          >
            <FaBars />
          </button>

          <h1 className="font-bold text-[#54091b]">MTC Admin</h1>
        </div>

        <main className="min-h-screen p-4 sm:p-6">
          <div key={location.pathname} className="animate-admin-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
