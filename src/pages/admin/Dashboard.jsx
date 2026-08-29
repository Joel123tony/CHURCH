import { useEffect, useState } from "react";
import API from "../../api/axios";
import { getStoredUser } from "../../utils/auth";
import {
  FaCalendarAlt,
  FaChurch,
  FaImages,
  FaPrayingHands,
  FaCommentDots,
  FaBookOpen,
} from "react-icons/fa";

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
        console.error("Dashboard Error:", err.response?.data || err.message);
      }
    };

    loadDashboard();
  }, []);

  const cards = [
    {
      label: "Pastors",
      value: stats?.counts?.pastors,
      icon: FaChurch,
      iconWrap: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Events",
      value: stats?.counts?.events,
      icon: FaCalendarAlt,
      iconWrap: "bg-amber-100 text-amber-700",
    },
    {
      label: "Gallery",
      value: stats?.counts?.gallery,
      icon: FaImages,
      iconWrap: "bg-sky-100 text-sky-700",
    },
    {
      label: "Prayer Requests",
      value: stats?.counts?.prayerRequests,
      icon: FaPrayingHands,
      iconWrap: "bg-rose-100 text-rose-700",
    },
    {
      label: "Pastor Messages",
      value: stats?.counts?.pastorMessages,
      icon: FaCommentDots,
      iconWrap: "bg-purple-100 text-purple-700",
    },
    {
      label: "Books",
      value: stats?.counts?.books,
      icon: FaBookOpen,
      iconWrap: "bg-teal-100 text-teal-700",
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="animate-admin-card-in rounded-3xl border border-slate-100 bg-white p-5 shadow-lg sm:p-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Admin Overview
          </p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {user ? `Welcome ${user.username || user.name || "Admin"}` : "Dashboard"}
          </h1>
          <p className="max-w-2xl text-sm text-slate-500 sm:text-base">
            Church Admin Dashboard
          </p>
        </div>
      </div>

      {stats?.counts && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="group animate-admin-card-in flex flex-col justify-between aspect-square sm:aspect-auto rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-3.5 sm:p-4 shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-[6px] hover:scale-[1.02] hover:shadow-2xl"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
                  <p className="order-2 sm:order-1 text-xs sm:text-sm font-medium text-slate-500 leading-tight line-clamp-2">
                    {card.label}
                  </p>
                  <div className={`order-1 sm:order-2 flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl transition-transform duration-300 ease-in-out group-hover:rotate-6 group-hover:scale-110 ${card.iconWrap}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>

                <p className="mt-1 sm:mt-4 text-2xl sm:text-3xl font-bold text-slate-900">
                  {card.value ?? 0}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
