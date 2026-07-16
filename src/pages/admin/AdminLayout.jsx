import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Menu,
  CalendarDays,
  Clock,
  LayoutDashboard,
  Images,
  HandHeart,
  LogOut,
  X,
  ShieldCheck,
  Users,
  MessageSquare,
  BookOpen,
  Globe,
  HeartHandshake
} from "lucide-react";

const AdminClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-5 flex flex-col gap-2 rounded-2xl bg-black/10 px-4 py-3 text-white/80">
      <div className="flex items-center gap-2.5">
        <CalendarDays className="h-3.5 w-3.5 text-[#EFBF04]" strokeWidth={2} />
        <span className="text-[11px] font-medium tracking-wide">
          {currentTime.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <Clock className="h-3.5 w-3.5 text-[#EFBF04]" strokeWidth={2} />
        <span className="text-[11px] font-medium tracking-wide">
          {currentTime.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </span>
      </div>
    </div>
  );
};

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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
        { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
        { to: "/admin/settings", label: "Settings", icon: ShieldCheck },
      ],
    },
    {
      title: "CONTENT",
      links: [
        { to: "/admin/pastors", label: "Pastors", icon: Users },
        { to: "/admin/events", label: "Events", icon: CalendarDays },
        { to: "/admin/gallery", label: "Gallery", icon: Images },
        { to: "/admin/prayer-requests", label: "Prayer Requests", icon: HandHeart },
        { to: "/admin/pastor-message", label: "Pastor Messages", icon: MessageSquare },
        { to: "/admin/books", label: "Books", icon: BookOpen },
        { to: "/admin/donations", label: "Donations", icon: HeartHandshake },
      ],
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#f4efe7] text-slate-900">
      {/* Mobile Drawer Overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 transition-opacity md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col overflow-hidden
          bg-[#531B24] transition-transform duration-200 ease-in-out
          ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Compact Admin Card */}
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EFBF04]/10 text-[#EFBF04]">
                <ShieldCheck className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-bold text-white tracking-wide leading-tight">MTC Admin</h1>
                <p className="truncate text-[12px] font-medium text-white/50">{user?.name || "Administrator"}</p>
              </div>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors md:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <AdminClock />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 admin-scrollbar">
          <div className="flex flex-col gap-7">
            {navSections.map((section) => (
              <div key={section.title} className="flex flex-col gap-2">
                <h2 className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  {section.title}
                </h2>
                <div className="flex flex-col gap-1.5">
                  {section.links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3.5 rounded-2xl px-3 py-3 text-[13.5px] font-medium tracking-wide transition-colors duration-200 ${
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-[3px] rounded-r-full bg-[#EFBF04] transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                          <link.icon className={`h-5 w-5 shrink-0 transition-colors duration-200 ${isActive ? "text-[#EFBF04]" : "text-white/40 group-hover:text-white/80"}`} strokeWidth={2} />
                          <span>{link.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-white/5 p-4 flex flex-col gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-full items-center gap-3.5 rounded-2xl border border-[#F4EFE7]/15 bg-transparent px-4 py-3 text-[13.5px] font-medium tracking-wide text-[#F4EFE7] transition-colors duration-200 hover:bg-white/5"
          >
            <Globe className="h-5 w-5 shrink-0 text-[#F4EFE7]/70 group-hover:text-[#F4EFE7]" strokeWidth={2} />
            <span>View MTC Padikuppam</span>
          </a>

          <button
            onClick={logout}
            className="group flex w-full items-center gap-3.5 rounded-2xl bg-transparent px-4 py-3 text-[13.5px] font-medium tracking-wide text-white/60 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5 shrink-0 transition-colors duration-200 group-hover:text-red-400" strokeWidth={2} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`min-h-screen flex-1 flex flex-col transition-transform duration-200 md:ml-[260px] ${
          menuOpen ? "pointer-events-none select-none" : ""
        }`}
      >
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#531B24] transition-colors hover:bg-slate-200"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>
            <h1 className="text-base font-bold text-[#531B24]">MTC Admin</h1>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 w-full relative">
          <Outlet />
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
