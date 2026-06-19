import { useEffect, useState } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

import { FaFire, FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";

export default function Events() {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get("/events");
        setEvents(res?.data?.data || []);
      } catch (err) {
        console.error("Events fetch error:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const now = new Date();

  const latestEvent =
    events
      .filter((e) => new Date(e.date) <= now)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;

  const upcomingEvents = events.filter((e) => new Date(e.date) > now);

  if (loading) {
    return (
      <section id="events" className="bg-primary py-20 text-center text-white">
        {t("events.loading")}
      </section>
    );
  }

  return (
    <section id="events" className="relative bg-primary py-20 lg:py-28 overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center mb-6">
          <h2 className="text-white text-3xl font-bold">{t("events.title")}</h2>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <FaFire className="text-orange-400 text-2xl" />
              <h3 className="text-2xl font-bold text-white">{t("events.featured")}</h3>
            </div>

            {latestEvent ? (
              <div className="bg-gradient-to-br from-white to-[#f8f5f0] rounded-[32px] p-8 shadow-2xl border border-white/50 transition-all duration-300 hover:-translate-y-2">
                <div className="inline-flex px-4 py-2 rounded-full bg-primary text-white text-sm font-medium mb-6">
                  {t("events.latest")}
                </div>

                <h3 className="text-3xl font-bold text-primary mb-8">
                  {latestEvent.title}
                </h3>

                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FaCalendarAlt className="text-primary" />
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase">{t("events.date")}</p>
                      <p className="font-medium">
                        {new Date(latestEvent.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FaClock className="text-primary" />
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase">{t("events.time")}</p>
                      <p className="font-medium">{latestEvent.time || "TBA"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FaMapMarkerAlt className="text-primary" />
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase">{t("events.venue")}</p>
                      <p className="font-medium">{latestEvent.venue}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur rounded-3xl p-8 text-white">
                {t("events.noLatest")}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FaCalendarAlt className="text-cream text-2xl" />
                <h3 className="text-2xl font-bold text-white">{t("events.upcoming")}</h3>
              </div>

              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">
                {upcomingEvents.length}
              </span>
            </div>

            <div className="space-y-5 max-h-[650px] overflow-y-auto pr-2">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div
                    key={event._id}
                    className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all duration-300"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cream rounded-l-3xl" />

                    <h4 className="text-xl font-semibold text-white mb-4">
                      {event.title}
                    </h4>

                    <div className="space-y-3 text-white/80 text-sm">
                      <div className="flex items-center gap-3">
                        <FaCalendarAlt />
                        <span>
                          {new Date(event.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <FaClock />
                        <span>{event.time || "TBA"}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <FaMapMarkerAlt />
                        <span>{event.venue}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/10 backdrop-blur rounded-3xl p-8 text-white">
                  {t("events.noUpcoming")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
