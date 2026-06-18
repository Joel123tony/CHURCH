import { useEffect, useState } from "react";
import API from "../../api/axios";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("Methodist Tamil church Padikuppam");
  const [customVenue, setCustomVenue] = useState("");

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  /* TOAST */
  const toast = (msg, color = "green") => {
    const div = document.createElement("div");
    div.innerText = msg;
    div.style.position = "fixed";
    div.style.top = "20px";
    div.style.right = "20px";
    div.style.background = color;
    div.style.color = "white";
    div.style.padding = "10px 15px";
    div.style.borderRadius = "8px";
    div.style.zIndex = 9999;

    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  };

  /* FETCH */
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get("/events");
      setEvents(res.data?.data || []);
    } catch (err) {
      console.error("Fetch events error:", err);
      toast("Failed to load events", "red");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  /* SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalVenue =
      venue === "Custom" ? customVenue : venue;

    if (!title || !date || !time || !finalVenue) {
      toast("Please fill all fields", "red");
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
        toast("Event updated");
      } else {
        await API.post("/events", {
          title,
          date,
          time,
          venue: finalVenue,
        });
        toast("Event created");
      }

      setTitle("");
      setDate("");
      setTime("");
      setVenue("Methodist Tamil church Padikuppam");
      setCustomVenue("");
      setEditId(null);

      fetchEvents();
    } catch (err) {
      console.error("Save event error:", err);
      toast("Server error while saving event", "red");
    }
  };

  /* DELETE */
  const handleDelete = async (id) => {
    try {
      await API.delete(`/events/${id}`);
      toast("Event deleted");
      fetchEvents();
    } catch (err) {
      console.error(err);
      toast("Delete failed", "red");
    }
  };

  /* EDIT */
  const handleEdit = (eventItem) => {
    setEditId(eventItem._id);
    setTitle(eventItem.title);
    setDate(eventItem.date?.split("T")[0] || "");
    setTime(eventItem.time || "");

    const knownVenue = "Methodist Tamil church Padikuppam";
    if (eventItem.venue === knownVenue) {
      setVenue(knownVenue);
      setCustomVenue("");
    } else {
      setVenue("Custom");
      setCustomVenue(eventItem.venue);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">

      <h1 className="text-2xl font-bold">Events Admin</h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 sm:p-6 rounded-2xl shadow space-y-3"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event Title"
          className="border p-3 w-full rounded-xl"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-3 w-full rounded-xl"
          />

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border p-3 w-full rounded-xl"
          />
        </div>

        <select
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="border p-3 w-full rounded-xl"
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
            className="border p-3 w-full rounded-xl"
          />
        )}

        <button className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-medium">
          {editId ? "Update Event" : "Create Event"}
        </button>
      </form>

      {/* LIST */}
      {loading ? (
        <p className="text-gray-500">Loading events...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((eventItem) => (
            <div
              key={eventItem._id}
              className="bg-white p-4 rounded-2xl shadow flex flex-col gap-2"
            >
              <h2 className="font-bold text-lg">
                {eventItem.title}
              </h2>

              <p className="text-sm text-gray-600">
                📅 {new Date(eventItem.date).toDateString()}
              </p>

              <p className="text-sm text-gray-600">
                ⏰ {eventItem.time}
              </p>

              <p className="text-sm text-gray-500">
                📍 {eventItem.venue}
              </p>

              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <button
                  onClick={() => handleEdit(eventItem)}
                  className="w-full sm:w-auto bg-yellow-500 px-4 py-2 rounded-xl text-white"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(eventItem._id)}
                  className="w-full sm:w-auto bg-red-500 px-4 py-2 rounded-xl text-white"
                >
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