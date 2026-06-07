import { useEffect, useState } from "react";
import axios from "axios";
import { getStoredUser } from "../../utils/auth";

export default function Dashboard() {
  const [user, setUser] = useState(getStoredUser());
  const [stats, setStats] = useState(null);
  const isDeveloper = user?.role === "developer";

  useEffect(() => {
    axios
      .get("/api/admin/dashboard", { withCredentials: true })
      .then((res) => {
        setUser(res.data.user);
        setStats(res.data);
      })
      .catch(() => {
        setStats(null);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-2">
          {stats?.message ||
            (user
              ? `Welcome ${isDeveloper ? "Developer" : "Pastor"} ${user.name}`
              : "Dashboard")}
        </h1>
        <p className="text-gray-600">
          {isDeveloper
            ? "You have full control over the church admin panel."
            : "You have limited access to dashboard and church data."}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold">Dashboard</h3>
          <p className="text-sm text-gray-600">
            View reports and summaries
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold">Church Data</h3>
          <p className="text-sm text-gray-600">
            View sermons and ministry stats
          </p>
        </div>
        {isDeveloper && (
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold">Developer Controls</h3>
            <p className="text-sm text-gray-600">Settings, users, homepage</p>
          </div>
        )}
      </div>

      {stats?.counts && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-500">Pastors</p>
            <p className="text-2xl font-bold">{stats.counts.pastors}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-500">Sermons</p>
            <p className="text-2xl font-bold">{stats.counts.sermons}</p>
          </div>
          {isDeveloper && (
            <div className="bg-white p-4 rounded-xl shadow">
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-2xl font-bold">{stats.counts.users}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
