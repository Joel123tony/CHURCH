import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getStoredUser } from "../../utils/auth";

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);

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
      <div
        className="w-64 text-white p-4 fixed h-full shadow-xl"
        style={{ backgroundColor: "#54091b" }}   // 🟤 Sidebar color
      >
        <h1 className="text-xl font-bold mb-2">
          MTC Admin
          style={{ color: "#EFBF04" }} 
        </h1>

        <p className="text-sm text-gray-200 mb-6">
          {user?.name || "Administrator"}
        </p>

        <nav className="flex flex-col gap-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `transition px-2 py-1 rounded ${
                  isActive
                    ? "font-semibold"
                    : "hover:opacity-80"
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? "#ffffff" : "#ee0039" , // 🔴 secondary highlight
                backgroundColor: isActive ? "rgba(238,0,57,0.1)" : "transparent",
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="mt-8 w-full py-2 rounded text-white font-semibold hover:opacity-90"
          style={{ backgroundColor: "#ee0039" }} // 🔴 secondary color
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