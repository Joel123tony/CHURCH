import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getStoredUser } from "../../utils/auth";

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);

    // 🔐 Protect admin routes
    if (!storedUser) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    navigate("/admin/login");
  };

  const links = [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/pastors", label: "Pastors" },
    { to: "/admin/events", label: "Events" },
    { to: "/admin/gallery", label: "Gallery" },
    { to: "/admin/messages", label: "Messages" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-900 text-white p-4 fixed h-full">
        <h1 className="text-xl font-bold mb-2">MTC Admin</h1>

        <p className="text-sm text-gray-300 mb-6">
          {user?.name || "Administrator"}
        </p>

        <nav className="flex flex-col gap-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `hover:text-yellow-400 transition ${
                  isActive ? "text-yellow-400 font-semibold" : ""
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="mt-8 w-full bg-red-600 hover:bg-red-700 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 ml-64 p-6 bg-gray-100 min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}