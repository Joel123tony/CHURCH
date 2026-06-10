import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // No token → go login
    if (!token) {
      navigate("/admin/login");
      return;
    }

    // Try loading user
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("user")
      );

      if (storedUser) {
        setUser(storedUser);
      } else {
        setUser({
          name: "Administrator",
        });
      }
    } catch {
      setUser({
        name: "Administrator",
      });
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/admin/login", {
      replace: true,
    });
  };

  const links = [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/pastors", label: "Pastors" },
    { to: "/admin/events", label: "Events" },
    { to: "/admin/gallery", label: "Gallery" },
    { to: "/admin/messages", label: "Messages" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside
        className="w-64 fixed left-0 top-0 h-screen shadow-2xl flex flex-col"
        style={{ backgroundColor: "#54091b" }}
      >
        {/* HEADER */}
        <div className="p-5 border-b border-white/10">
          <h1
            className="text-2xl font-bold"
            style={{ color: "#EFBF04" }}
          >
            MTC Admin
          </h1>

          <p className="text-gray-300 text-sm mt-2">
            {user?.name || "Administrator"}
          </p>
        </div>

        {/* MENU */}
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/admin"}
              className={({ isActive }) =>
                `px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                  isActive
                    ? "text-white shadow"
                    : "text-gray-200 hover:text-white"
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive
                  ? "#ee0039"
                  : "transparent",
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: "#ee0039",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}