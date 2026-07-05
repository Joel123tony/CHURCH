import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import { ToastContainer, toast } from "react-toastify";
import { useConfirm } from "../../context/ConfirmContext";
import "react-toastify/dist/ReactToastify.css";
import {
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaMapMarkerAlt,
  FaPlus,
  FaList,
  FaTrashAlt,
  FaTimes,
  FaCalendarCheck
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
  const confirm = useConfirm();
  const [events, setEvents] = useState([]);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState("add"); // "add" | "list"

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
      setActiveTab("list");
    } catch (err) {
      console.error("Save event error:", err);
      toast.error(
        err?.response?.data?.message || "Server error while saving event"
      );
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete Event",
      message: "Are you sure you want to delete this event?",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true,
    });
    if (!ok) return;

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

    setActiveTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Editing event");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen w-full">
      {/* HEADER SECTION - strictly functional, no descriptions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#54091b] flex items-center gap-3 tracking-tight">
            <FaCalendarCheck className="text-[#ee0039]" />
            Events Admin
          </h1>
        </div>
        <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
          {orderedEvents.length} Events Total
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm w-max border border-slate-100">
        <button
          onClick={() => { 
            if (activeTab !== "add") resetForm(); 
            setActiveTab("add"); 
          }}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeTab === "add" 
              ? "bg-[#ee0039] text-white shadow-md" 
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {editId !== null ? <FaEdit /> : <FaPlus />}
          {editId !== null ? "Edit Event" : "Add Event"}
        </button>
        <button
          onClick={() => { resetForm(); setActiveTab("list"); }}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeTab === "list" 
              ? "bg-[#54091b] text-white shadow-md" 
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <FaList />
          Events List
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-slate-500 font-medium">Loading events...</p>
        </div>
      ) : (
        <div className="relative w-full">
          {/* ADD/EDIT TAB */}
          {activeTab === "add" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 max-w-3xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800">
                    {editId !== null ? "Edit Event" : "Add New Event"}
                  </h2>
                  {editId !== null && (
                    <button 
                      onClick={() => { resetForm(); setActiveTab("list"); }}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-bold flex items-center gap-2"
                    >
                      <FaTimes /> Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Event Title *
                      </label>
                      <input
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Sunday Morning Service"
                        className="w-full border-2 border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-4 focus:ring-[#ee0039]/20 focus:border-[#ee0039] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Date *
                      </label>
                      <div className="relative">
                        <FaCalendarAlt className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full border-2 border-slate-200 rounded-xl p-3.5 pl-11 focus:outline-none focus:ring-4 focus:ring-[#ee0039]/20 focus:border-[#ee0039] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Time *
                      </label>
                      <div className="relative">
                        <FaClock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="time"
                          required
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full border-2 border-slate-200 rounded-xl p-3.5 pl-11 focus:outline-none focus:ring-4 focus:ring-[#ee0039]/20 focus:border-[#ee0039] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                      Venue *
                    </label>
                    <select
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-4 focus:ring-[#ee0039]/20 focus:border-[#ee0039] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium appearance-none"
                    >
                      <option value="Methodist Tamil church Padikuppam">
                        Methodist Tamil church Padikuppam
                      </option>
                      <option value="Custom">Custom Venue</option>
                    </select>
                  </div>

                  {venue === "Custom" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Custom Venue Details *
                      </label>
                      <input
                        required
                        value={customVenue}
                        onChange={(e) => setCustomVenue(e.target.value)}
                        placeholder="Enter full address of custom venue"
                        className="w-full border-2 border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-4 focus:ring-[#ee0039]/20 focus:border-[#ee0039] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium"
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button
                      type="submit"
                      className="px-8 py-3.5 rounded-xl text-white bg-[#ee0039] hover:bg-[#d00030] transition-colors font-bold flex items-center gap-2 shadow-lg shadow-[#ee0039]/30"
                    >
                      {editId !== null ? <FaEdit size={14} /> : <FaPlus size={14} />}
                      {editId !== null ? "Save Changes" : "Create Event"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* LIST TAB */}
          {activeTab === "list" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              {orderedEvents.length === 0 ? (
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm w-full">
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 font-medium">
                    No events found. Click "Add Event" to create your first event.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {orderedEvents.map((eventItem, index) => (
                    <div
                      key={eventItem._id}
                      className="animate-admin-card-in rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col"
                      style={{
                        animationDelay: `${Math.min(index, 10) * 70}ms`,
                      }}
                    >
                      <h2 className="text-lg font-bold text-[#54091b] line-clamp-2">{eventItem.title}</h2>

                      <div className="mt-4 space-y-2.5 text-sm font-medium text-slate-600 flex-1">
                        <p className="flex items-start gap-3">
                          <FaCalendarAlt className="text-[#ee0039] mt-0.5 shrink-0" />
                          <span>{new Date(eventItem.date).toDateString()}</span>
                        </p>

                        <p className="flex items-start gap-3">
                          <FaClock className="text-[#ee0039] mt-0.5 shrink-0" />
                          <span>{formatTime12Hour(eventItem.time)}</span>
                        </p>

                        <p className="flex items-start gap-3">
                          <FaMapMarkerAlt className="text-slate-400 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{eventItem.venue}</span>
                        </p>
                      </div>

                      <div className="mt-5 flex gap-2 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleEdit(eventItem)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          <FaEdit />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(eventItem._id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
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
          )}
        </div>
      )}
    </div>
  );
}
