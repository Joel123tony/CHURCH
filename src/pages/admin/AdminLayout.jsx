import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  /* LIVE CLOCK */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* AUTH CHECK */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
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

  const links = [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/pastors", label: "Pastors" },
    { to: "/admin/events", label: "Events" },
    { to: "/admin/gallery", label: "Gallery" },
    { to: "/admin/prayer-requests", label: "Prayer Requests" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* OVERLAY */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:fixed top-0 left-0
          h-full w-64 z-50
          bg-[#54091b]
          transform transition-transform duration-300
          ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          flex flex-col
        `}
      >

        {/* HEADER */}
        <div className="p-5 border-b border-white/10">
          <h1 className="text-2xl font-bold text-[#EFBF04]">
            MTC Admin
          </h1>

          <p className="text-gray-300 text-sm mt-2">
            {user?.name || "Administrator"}
          </p>

          <div className="mt-3 text-xs text-gray-300">
            <p>
              {currentTime.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>

            <p>
              {currentTime.toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                  isActive
                    ? "text-white bg-[#ee0039]"
                    : "text-gray-200 hover:text-white hover:bg-white/10"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full py-3 rounded-lg font-semibold text-white bg-[#ee0039] hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 md:ml-64 min-h-screen">

        {/* TOP BAR */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white shadow">
          <button
            onClick={() => setMenuOpen(true)}
            className="text-2xl font-bold"
          >
            ☰
          </button>

          <h1 className="font-bold text-[#54091b]">
            MTC Admin
          </h1>
        </div>

        {/* CONTENT */}
        <main className="p-4 sm:p-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}