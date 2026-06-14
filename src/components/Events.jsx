import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  /* FETCH */
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

  /* SPLIT EVENTS */
  const latestEvent = events
    .filter((e) => new Date(e.date) <= now)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  const upcomingEvents = events
    .filter((e) => new Date(e.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

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
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-3xl font-bold text-white mb-10">
          Events
        </h2>

        <div className="grid md:grid-cols-2 gap-8">

          {/* LATEST EVENT */}
          <div className="bg-cream p-6 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4">
              Latest Event
            </h3>

            {latestEvent ? (
              <>
                <div className="h-64 bg-gray-200 rounded-2xl mb-5"></div>
                <p><b>Title:</b> {latestEvent.title}</p>
                <p><b>Date:</b> {new Date(latestEvent.date).toDateString()}</p>
                <p><b>Time:</b> {latestEvent.time || "-"}</p>
                <p><b>Location:</b> {latestEvent.venue}</p>
              </>
            ) : (
              <p>No latest event</p>
            )}
          </div>

          {/* UPCOMING EVENTS */}
          <div className="bg-cream p-6 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4">
              Upcoming Event
            </h3>

            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((e) => (
                  <div key={e._id} className="border p-3 rounded-xl bg-white">
                    <h4 className="font-bold">{e.title}</h4>
                    <p>{new Date(e.date).toDateString()}</p>
                    <p>{e.time || "-"}</p>
                    <p>{e.venue}</p>
                  </div>
                ))
              ) : (
                <p>No upcoming events</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}