import { Link, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">

      {/* SIDEBAR */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-6">MTC Admin</h1>

        <nav className="flex flex-col gap-3">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/pastors">Pastors</Link>
          <Link to="/admin/events">Events</Link>
          <Link to="/admin/gallery">Gallery</Link>
          <Link to="/admin/messages">Messages</Link>
        </nav>
      </div>

      {/* CONTENT AREA (THIS WAS MISSING BEFORE) */}
      <div className="flex-1 p-6 bg-gray-100">
        <Outlet />
      </div>

    </div>
  );
}