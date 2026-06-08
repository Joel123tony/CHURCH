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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-2">
          {user
            ? `Welcome ${user.username || user.name || "Admin"}`
            : "Dashboard"}
        </h1>

        <p className="text-gray-600">
          Church Admin Dashboard
        </p>
      </div>

      {stats?.counts && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-500">Pastors</p>
            <p className="text-2xl font-bold">
              {stats.counts.pastors}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-500">Sermons</p>
            <p className="text-2xl font-bold">
              {stats.counts.sermons}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-500">Users</p>
            <p className="text-2xl font-bold">
              {stats.counts.users}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}