import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { getStoredUser } from "../../utils/auth";

export default function AdminLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const role = user?.role || "pastor";
  const isDeveloper = role === "developer";

  const links = [
    { to: "/admin", label: "Dashboard", roles: ["developer", "pastor"] },
    { to: "/admin/pastors", label: "Pastors", roles: ["developer"] },
    { to: "/admin/events", label: "Events", roles: ["developer", "pastor"] },
    { to: "/admin/gallery", label: "Gallery", roles: ["developer", "pastor"] },
    { to: "/admin/messages", label: "Messages", roles: ["developer", "pastor"] },
  ];

  return (
    <div className="flex min-h-screen">

      {/* SIDEBAR */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-2">MTC Admin</h1>
        <p className="text-sm text-gray-300 mb-6">
          {user ? `${isDeveloper ? "Developer" : "Pastor"} ${user.name}` : "Admin"}
        </p>

        <nav className="flex flex-col gap-3">
          {links
            .filter((link) => link.roles.includes(role))
            .map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
        </nav>
      </div>

      {/* CONTENT AREA (THIS WAS MISSING BEFORE) */}
      <div className="flex-1 p-6 bg-gray-100">
        <Outlet />
      </div>

    </div>
  );
}
