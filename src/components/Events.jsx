import { useEffect, useState } from "react";
import API from "../api/axios";

import {
  FaFire,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
} from "react-icons/fa";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        const res = await API.get("/events");
        const data = res?.data?.data || [];

        const sorted = [...data].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        setEvents(sorted);
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

  const latestEvent = events
    .filter((e) => new Date(e.date) <= now)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  const upcomingEvents = events.filter(
    (e) => new Date(e.date) > now
  );

  const EventCard = ({ children, glow = false }) => (
    <div
      className={`p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-md
      transform transition duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl
      ${glow ? "ring-2 ring-[#5b1220]/30" : ""}`}
    >
      {children}
    </div>
  );

  if (loading) {
    return (
      <section className="bg-primary py-16 text-white">
        <div className="max-w-7xl mx-auto px-6">
          Loading events...
        </div>
      </section>
    );
  }

 return (
  <section className="bg-primary py-16">
    <div className="max-w-6xl mx-auto px-6">

      {/* TITLE */}
      <h2 className="text-4xl font-bold text-white mb-10 text-center">
        Church Events
      </h2>

      <div className="grid md:grid-cols-2 gap-10">

        {/* ================= LATEST ================= */}
        <div>
          <h3 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
            <FaFire className="text-orange-400" />
            Latest Event
          </h3>

          {latestEvent ? (
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-white/30 flex flex-col gap-3">

              <p className="text-xl font-bold text-gray-900">
                {latestEvent.title}
              </p>

              <div className="text-gray-600 flex flex-col gap-2 text-sm">

                <p className="flex items-center gap-2">
                  <FaCalendarAlt />
                  {new Date(latestEvent.date).toDateString()}
                </p>

                <p className="flex items-center gap-2">
                  <FaClock />
                  {latestEvent.time || "TBA"}
                </p>

                <p className="flex items-center gap-2">
                  <FaMapMarkerAlt />
                  {latestEvent.venue}
                </p>

              </div>
            </div>
          ) : (
            <p className="text-white/70">No latest event</p>
          )}
        </div>

        {/* ================= UPCOMING ================= */}
        <div>
          <h3 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
            <FaCalendarAlt className="text-blue-300" />
            Upcoming Events
          </h3>

          <div className="flex flex-col gap-5 max-h-[500px] overflow-y-auto pr-2">

            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((e) => (
                <div
                  key={e._id}
className="bg-white rounded-3xl p-6 shadow-lg border border-white/30 flex flex-col gap-3 transition-transform duration-200 hover:shadow-xl hover:-translate-y-1"                >

                  <p className="text-lg font-bold text-gray-900">
                    {e.title}
                  </p>

                  <div className="text-sm text-gray-600 flex flex-col gap-2">

                    <p className="flex items-center gap-2">
                      <FaCalendarAlt />
                      {new Date(e.date).toDateString()}
                    </p>

                    <p className="flex items-center gap-2">
                      <FaClock />
                      {e.time || "TBA"}
                    </p>

                    <p className="flex items-center gap-2">
                      <FaMapMarkerAlt />
                      {e.venue}
                    </p>

                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/70">No upcoming events</p>
            )}

          </div>
        </div>

      </div>
    </div>
  </section>
);
}