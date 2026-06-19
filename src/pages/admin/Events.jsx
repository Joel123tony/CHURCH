import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaMapMarkerAlt,
  FaPlusCircle,
  FaTrashAlt,
} from "react-icons/fa";

const formatTime12Hour = (value) => {
  if (!value) return "-";

  const [hoursRaw, minutesRaw] = String(value).split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${period}`;
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("Methodist Tamil church Padikuppam");
  const [customVenue, setCustomVenue] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get("/events");
      setEvents(res.data?.data || []);
    } catch (err) {
      console.error("Fetch events error:", err);
      toast.error(err?.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const orderedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }, [events]);

  const resetForm = () => {
    setTitle("");
    setDate("");
    setTime("");
    setVenue("Methodist Tamil church Padikuppam");
    setCustomVenue("");
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalVenue = venue === "Custom" ? customVenue.trim() : venue;

    if (!title || !date || !time || !finalVenue) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      if (editId) {
        await API.put(`/events/${editId}`, {
          title,
          date,
          time,
          venue: finalVenue,
        });
        toast.success("Event updated successfully");
      } else {
        await API.post("/events", {
          title,
          date,
          time,
          venue: finalVenue,
        });
        toast.success("Event added successfully");
      }

      resetForm();
      fetchEvents();
    } catch (err) {
      console.error("Save event error:", err);
      toast.error(
        err?.response?.data?.message || "Server error while saving event"
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;

    try {
      await API.delete(`/events/${id}`);
      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const handleEdit = (eventItem) => {
    setEditId(eventItem._id);
    setTitle(eventItem.title || "");
    setDate(eventItem.date?.split("T")[0] || "");
    setTime(eventItem.time || "");

    const knownVenue = "Methodist Tamil church Padikuppam";
    if (eventItem.venue === knownVenue) {
      setVenue(knownVenue);
      setCustomVenue("");
    } else {
      setVenue("Custom");
      setCustomVenue(eventItem.venue || "");
    }

    toast.info("Editing event");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-4 sm:px-6">
      <ToastContainer
        position="top-right"
        autoClose={1800}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />

      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-lg sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Event Management
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Events Admin
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create, update, and organize church events from a mobile-friendly dashboard.
            </p>
          </div>

          <div className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800">
            {orderedEvents.length} events
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event Title"
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative">
              <FaCalendarAlt className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 pl-11 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="relative">
              <FaClock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 pl-11 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <select
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="Methodist Tamil church Padikuppam">
              Methodist Tamil church Padikuppam
            </option>
            <option value="Custom">Custom</option>
          </select>

          {venue === "Custom" && (
            <input
              value={customVenue}
              onChange={(e) => setCustomVenue(e.target.value)}
              placeholder="Enter custom venue"
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          )}

          <button
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white transition-colors sm:w-auto ${
              editId
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            <FaPlusCircle />
            {editId ? "Update Event" : "Create Event"}
          </button>
        </form>
      </div>

      {loading ? (
        <p className="text-center text-slate-500">Loading events...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedEvents.map((eventItem, index) => (
            <div
              key={eventItem._id}
              className="animate-admin-card-in rounded-3xl border border-slate-100 bg-white p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{
                animationDelay: `${Math.min(index, 10) * 70}ms`,
              }}
            >
              <h2 className="text-lg font-bold text-slate-900">{eventItem.title}</h2>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="inline-flex items-center gap-2">
                  <FaCalendarAlt className="text-amber-600" />
                  {new Date(eventItem.date).toDateString()}
                </p>

                <p className="inline-flex items-center gap-2">
                  <FaClock className="text-amber-600" />
                  {formatTime12Hour(eventItem.time)}
                </p>

                <p className="inline-flex items-center gap-2">
                  <FaMapMarkerAlt className="text-rose-600" />
                  {eventItem.venue}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => handleEdit(eventItem)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                >
                  <FaEdit />
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(eventItem._id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  <FaTrashAlt />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
