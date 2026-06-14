import { useEffect, useState } from "react";
import API from "../../api/axios";
import { getStoredUser } from "../../utils/auth";

export default function Dashboard() {
  const [user, setUser] = useState(getStoredUser());
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await API.get("/admin/dashboard");

        setUser(res.data.user);
        setStats(res.data);
      } catch (err) {
        console.error(
          "Dashboard Error:",
          err.response?.data || err.message
        );
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-6 p-3 sm:p-6">

      {/* HEADER */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">
          {user
            ? `Welcome ${user.username || user.name || "Admin"}`
            : "Dashboard"}
        </h1>

        <p className="text-gray-600 text-sm sm:text-base">
          Church Admin Dashboard
        </p>
      </div>

      {/* STATS */}
      {stats?.counts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-500">Pastors</p>
            <p className="text-2xl font-bold">
              {stats.counts.pastors}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-500">Events</p>
            <p className="text-2xl font-bold">
              {stats.counts.events}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-500">Gallery</p>
            <p className="text-2xl font-bold">
              {stats.counts.gallery}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
            <p className="text-sm text-gray-500">
              Pending Prayer Requests
            </p>
            <p className="text-2xl font-bold text-red-600">
              {stats.counts.prayerRequests}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}