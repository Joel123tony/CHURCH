import { useEffect, useState } from "react";
import API from "../../api/axios";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState(
    "Methodist Tamil church Padikuppam"
  );

  const [editId, setEditId] = useState(null);

  /* FETCH */
  const fetchEvents = async () => {
    const res = await API.get("/events");
    setEvents(res.data.data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  /* TOAST */
  const toast = (msg) => {
    const div = document.createElement("div");
    div.innerText = msg;
    div.style.position = "fixed";
    div.style.top = "20px";
    div.style.right = "20px";
    div.style.background = "green";
    div.style.color = "white";
    div.style.padding = "10px 15px";
    div.style.borderRadius = "8px";
    div.style.zIndex = 9999;

    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  };

  /* SAVE */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editId) {
      await API.put(`/events/${editId}`, {
        title,
        date,
        time,
        venue,
      });
      toast("Event updated");
    } else {
      await API.post("/events", {
        title,
        date,
        time,
        venue,
      });
      toast("Event created");
    }

    setTitle("");
    setDate("");
    setTime("");
    setVenue("Methodist Tamil church Padikuppam");
    setEditId(null);

    fetchEvents();
  };

  /* DELETE */
  const handleDelete = async (id) => {
    await API.delete(`/events/${id}`);
    toast("Event deleted");
    fetchEvents();
  };

  /* EDIT */
  const handleEdit = (e) => {
    setEditId(e._id);
    setTitle(e.title);
    setDate(e.date?.split("T")[0]);
    setTime(e.time);
    setVenue(e.venue);
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
          <option>Methodist Tamil church Padikuppam</option>
          <option>Custom</option>
        </select>

        <button className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-medium">
          {editId ? "Update Event" : "Create Event"}
        </button>
      </form>

      {/* LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((e) => (
          <div
            key={e._id}
            className="bg-white p-4 rounded-2xl shadow flex flex-col gap-2"
          >
            <h2 className="font-bold text-lg">{e.title}</h2>

            <p className="text-sm text-gray-600">
              📅 {new Date(e.date).toDateString()}
            </p>

            <p className="text-sm text-gray-600">
              ⏰ {e.time}
            </p>

            <p className="text-sm text-gray-500">
              📍 {e.venue}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <button
                onClick={() => handleEdit(e)}
                className="w-full sm:w-auto bg-yellow-500 px-4 py-2 rounded-xl text-white"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(e._id)}
                className="w-full sm:w-auto bg-red-500 px-4 py-2 rounded-xl text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}