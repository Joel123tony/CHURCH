import { useEffect, useState } from "react";
import API from "../../api/axios";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("Methodist Tamil church Padikuppam");

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
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Events Admin</h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow space-y-3"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="border p-2 w-full"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 w-full"
        />

  <input
  type="time"
  value={time}
  onChange={(e) => setTime(e.target.value)}
  className="border p-2 w-full"
/>

        <select
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="border p-2 w-full"
        >
          <option>Methodist Tamil church Padikuppam</option>
          <option>Custom</option>
        </select>

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          {editId ? "Update Event" : "Create Event"}
        </button>
      </form>

      {/* LIST */}
      <div className="space-y-3">
        {events.map((e) => (
          <div
            key={e._id}
            className="bg-gray-100 p-3 rounded flex justify-between"
          >
            <div>
              <h2 className="font-bold">{e.title}</h2>
              <p>{new Date(e.date).toDateString()}</p>
              <p>{e.time}</p>
              <p>{e.venue}</p>
            </div>

            <div className="space-x-2">
              <button
                onClick={() => handleEdit(e)}
                className="bg-yellow-500 px-3 py-1 rounded"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(e._id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
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