import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";
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
  const [listFilter, setListFilter] = useState("all"); // "all" | "upcoming" | "completed"

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

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const upcoming = [];
    const past = [];
    const nowExact = Date.now();

    orderedEvents.forEach(eventItem => {
      if (!eventItem.date) return;
      const dateOnly = eventItem.date.split('T')[0];
      const combinedDateTime = new Date(`${dateOnly}T${eventItem.time || '00:00'}:00`);
      
      if (combinedDateTime.getTime() < nowExact) {
        past.push(eventItem);
      } else {
        upcoming.push(eventItem);
      }
    });

    // We might want upcoming events sorted chronologically (soonest first)
    upcoming.sort((a, b) => {
      const dateA = new Date(`${a.date.split('T')[0]}T${a.time || '00:00'}:00`);
      const dateB = new Date(`${b.date.split('T')[0]}T${b.time || '00:00'}:00`);
      return dateA.getTime() - dateB.getTime();
    });

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [orderedEvents]);

  const renderEventCard = (eventItem, index, isPast) => {
    const eventDate = new Date(eventItem.date);
    const isToday = eventDate.toDateString() === new Date().toDateString();
    
    return (
      <div
        key={eventItem._id}
        className={`animate-admin-card-in bg-white rounded-xl shadow-sm border ${isToday ? "border-amber-400" : "border-slate-200"} transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col`}
        style={{
          animationDelay: `${Math.min(index, 10) * 50}ms`,
        }}
      >
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h2 className={`text-base font-bold line-clamp-2 ${isPast ? "text-slate-500" : "text-[#531B24]"}`}>
              {eventItem.title}
            </h2>
            {isToday ? (
              <span className="shrink-0 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 border border-amber-200">
                Today
              </span>
            ) : isPast ? (
              <span className="shrink-0 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 border border-slate-200">
                Past
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 border border-emerald-200">
                Upcoming
              </span>
            )}
          </div>

          <div className="space-y-2 mt-auto pt-3 flex-1">
            <p className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
              <FaCalendarAlt className="text-slate-400 shrink-0" />
              <span>{eventDate.toDateString()}</span>
            </p>

            <p className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
              <FaClock className="text-slate-400 shrink-0" />
              <span>{formatTime12Hour(eventItem.time)}</span>
            </p>

            <p className="flex items-start gap-2 text-[12px] font-medium text-slate-600">
              <FaMapMarkerAlt className="text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{eventItem.venue}</span>
            </p>
          </div>

          <div className="mt-4 flex gap-1.5 pt-3 border-t border-slate-100">
            <button
              onClick={() => handleEdit(eventItem)}
              className="flex-1 flex justify-center py-1.5 bg-slate-50 hover:bg-slate-100 text-amber-600 border border-slate-200 rounded text-[11px] font-semibold transition-colors"
            >
              <FaEdit size={12} className="mr-1 mt-[1px]" />
              Edit
            </button>

            <button
              onClick={() => handleDelete(eventItem._id)}
              className="flex-1 flex justify-center py-1.5 bg-slate-50 hover:bg-red-50 text-red-600 border border-slate-200 rounded text-[11px] font-semibold transition-colors"
            >
              <FaTrashAlt size={12} className="mr-1 mt-[1px]" />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

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
    <div className="p-4 sm:p-6 lg:p-8 bg-[#F8F6F4] min-h-screen w-full font-sans">
      <div className="max-w-[1200px] mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#531B24] flex items-center gap-2 tracking-tight">
              Events Admin
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage and schedule church events.</p>
          </div>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
            <p className="text-sm font-bold text-slate-700">
              {orderedEvents.length} <span className="font-medium text-slate-500">Total Events</span>
            </p>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-max">
            <button
              onClick={() => { 
                if (activeTab !== "add") resetForm(); 
                setActiveTab("add"); 
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "add" 
                  ? "bg-[#531B24] text-white shadow-md" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#531B24]"
              }`}
            >
              {editId !== null ? <FaEdit size={12} /> : <FaPlus size={12} />}
              {editId !== null ? "Edit Event" : "Add Event"}
            </button>
            <button
              onClick={() => { resetForm(); setActiveTab("list"); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "list" 
                  ? "bg-[#531B24] text-white shadow-md" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#531B24]"
              }`}
            >
              <FaList size={12} />
              Events List
            </button>
          </div>
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">
                        {editId !== null ? "Edit Event" : "Add New Event"}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Fill in the event details.</p>
                    </div>
                    {editId !== null && (
                      <button 
                        onClick={() => { resetForm(); setActiveTab("list"); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                      >
                        <FaTimes size={12} /> Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Event Title *</label>
                      <input
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Sunday Morning Service"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Date *</label>
                        <div className="relative">
                          <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                          <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Time *</label>
                        <div className="relative">
                          <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                          <input
                            type="time"
                            required
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Venue *</label>
                      <select
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50 appearance-none"
                      >
                        <option value="Methodist Tamil church Padikuppam">
                          Methodist Tamil church Padikuppam
                        </option>
                        <option value="Custom">Custom Venue</option>
                      </select>
                    </div>

                    {venue === "Custom" && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Custom Venue Details *</label>
                        <input
                          required
                          value={customVenue}
                          onChange={(e) => setCustomVenue(e.target.value)}
                          placeholder="Enter full address of custom venue"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
                        />
                      </div>
                    )}

                    <div className="flex justify-end pt-5 border-t border-slate-100">
                      <button
                        type="submit"
                        className="px-6 py-2.5 text-sm font-bold text-white bg-[#531B24] rounded-lg hover:bg-[#40151c] transition-colors shadow-sm flex items-center gap-2"
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
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm w-full">
                    <div className="rounded-lg border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 font-medium">
                      No events found. Click "Add Event" to create your first event.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    
                    {/* SUB TABS for filtering */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                      <button 
                        onClick={() => setListFilter("all")}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${listFilter === "all" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                      >
                        All ({orderedEvents.length})
                      </button>
                      <button 
                        onClick={() => setListFilter("upcoming")}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${listFilter === "upcoming" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"}`}
                      >
                        Upcoming ({upcomingEvents.length})
                      </button>
                      <button 
                        onClick={() => setListFilter("completed")}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${listFilter === "completed" ? "bg-slate-600 text-white border-slate-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                      >
                        Completed ({pastEvents.length})
                      </button>
                    </div>

                    {/* UPCOMING EVENTS */}
                    {(listFilter === "all" || listFilter === "upcoming") && upcomingEvents.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                            Upcoming Events <span className="text-slate-400 normal-case tracking-normal">({upcomingEvents.length})</span>
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {upcomingEvents.map((e, idx) => renderEventCard(e, idx, false))}
                        </div>
                      </div>
                    )}

                    {/* NO UPCOMING STATE (Only shown if specifically filtering for upcoming and there are none) */}
                    {listFilter === "upcoming" && upcomingEvents.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 font-medium text-sm">
                        There are no upcoming events scheduled.
                      </div>
                    )}

                    {/* COMPLETED EVENTS */}
                    {(listFilter === "all" || listFilter === "completed") && pastEvents.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                            Completed / Past Events <span className="text-slate-400 normal-case tracking-normal">({pastEvents.length})</span>
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 opacity-90">
                          {pastEvents.map((e, idx) => renderEventCard(e, idx, true))}
                        </div>
                      </div>
                    )}

                    {/* NO PAST STATE (Only shown if specifically filtering for completed and there are none) */}
                    {listFilter === "completed" && pastEvents.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 font-medium text-sm">
                        There are no past events.
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
