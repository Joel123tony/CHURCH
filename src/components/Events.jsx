import { useEffect, useState } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

import { FaFire, FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";

export default function Events() {
  const { t, cmsData } = useLanguage();
  const styles = cmsData?.events?.styles || {};
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const parseEventTimestamp = (event) => {
    const date = new Date(event?.date);
    if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;

    const timeValue = `${event?.time || ""}`.trim().toLowerCase();
    let hours = 23;
    let minutes = 59;

    if (timeValue && timeValue !== "tba") {
      const match24 = timeValue.match(/^(\d{1,2}):(\d{2})$/);
      const match12 = timeValue.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/);

      if (match12) {
        hours = Number(match12[1]) % 12;
        if (match12[3] === "pm") hours += 12;
        minutes = Number(match12[2]);
      } else if (match24) {
        hours = Number(match24[1]);
        minutes = Number(match24[2]);
      }
    }

    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  };

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

  const upcomingEvents = events
    .filter((e) => new Date(e.date) > now)
    .sort((a, b) => parseEventTimestamp(a) - parseEventTimestamp(b))
    .slice(0, 2);

  if (loading) {
    return (
      <section id="events" className="py-20 text-center" style={{ backgroundColor: styles.backgroundColor || "#54091b", color: styles.textColor || "#F4EFE7" }}>
        {t("events.loading")}
      </section>
    );
  }

  return (
    <section id="events" className="relative py-20 lg:py-28 overflow-hidden" style={{ backgroundColor: styles.backgroundColor || "#54091b" }}>
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start mb-6">
          <h2 className="text-3xl font-bold text-left" style={{ color: styles.headingColor || "#F4EFE7" }}>{t("events.title")}</h2>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <FaFire className="text-2xl" style={{ color: styles.headingColor || "#F4EFE7" }} />
              <h3 className="text-2xl font-bold" style={{ color: styles.headingColor || "#F4EFE7" }}>{t("events.featured")}</h3>
            </div>

            {latestEvent ? (
              <div className="rounded-[28px] p-5 sm:p-6 shadow-2xl border border-white/50 transition-all duration-300 hover:-translate-y-1.5 max-w-[620px]" style={{ backgroundColor: styles.cardBackground || "#f4efe7" }}>
                <div className="inline-flex px-3.5 py-1.5 rounded-full bg-primary text-white text-xs sm:text-sm font-medium mb-4 sm:mb-5">
                  {t("events.latest")}
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-6 leading-tight" style={{ color: styles.cardTextColor || "#54091b" }}>
                  {latestEvent.title}
                </h3>

                <div className="space-y-4 sm:space-y-4.5">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FaCalendarAlt className="text-primary" />
                    </div>

                    <div>
                      <p className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wide">
                        {t("events.date")}
                      </p>
                      <p className="font-medium text-base sm:text-lg leading-tight">
                        {new Date(latestEvent.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FaClock className="text-primary" />
                    </div>

                    <div>
                      <p className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wide">
                        {t("events.time")}
                      </p>
                      <p className="font-medium text-base sm:text-lg leading-tight">
                        {latestEvent.time || "TBA"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FaMapMarkerAlt className="text-primary" />
                    </div>

                    <div>
                      <p className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wide">
                        {t("events.venue")}
                      </p>
                      <p className="font-medium text-base sm:text-lg leading-tight">
                        {latestEvent.venue}
                      </p>
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
                <FaCalendarAlt className="text-2xl" style={{ color: styles.headingColor || "#F4EFE7" }} />
                <h3 className="text-2xl font-bold" style={{ color: styles.headingColor || "#F4EFE7" }}>{t("events.upcoming")}</h3>
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
                    className="relative overflow-hidden rounded-[28px] p-5 sm:p-6 shadow-2xl border border-white/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-3xl"
                    style={{ backgroundColor: styles.cardBackground || "#f4efe7" }}
                  >
                    <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-[28px]" />

                    <h4 className="text-xl font-semibold mb-4" style={{ color: styles.cardTextColor || "#54091b" }}>
                      {event.title}
                    </h4>

                    <div className="space-y-3 text-gray-700 text-sm">
                      <div className="flex items-center gap-3">
                        <FaCalendarAlt className="text-primary" />
                        <span>
                          {new Date(event.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <FaClock className="text-primary" />
                        <span>{event.time || "TBA"}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <FaMapMarkerAlt className="text-primary" />
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
