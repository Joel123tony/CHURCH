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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="group animate-admin-card-in rounded-3xl border border-slate-100 bg-white p-4 shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-[6px] hover:scale-[1.02] hover:shadow-2xl"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500 leading-tight">{card.label}</p>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 ease-in-out group-hover:rotate-6 group-hover:scale-110 ${card.iconWrap}`}>
                    <Icon />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold text-slate-900">
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
