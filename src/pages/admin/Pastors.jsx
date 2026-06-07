import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/pastors";

export default function Pastors() {
  const [pastors, setPastors] = useState([]);
  const [form, setForm] = useState({
    name: "",
    joinedYear: "",
    leftYear: "",
    photo: "",
    details: ""
  });

  const load = async () => {
    const res = await axios.get(API);
    setPastors(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    await axios.post(API, form);
    load();
  };

  const setCurrent = async (id) => {
    await axios.put(`${API}/current/${id}`);
    load();
  };

  const del = async (id) => {
    await axios.delete(`${API}/${id}`);
    load();
  };

  return (
    <div>

      {/* FORM */}
      <div className="bg-white p-4 rounded-xl shadow max-w-md">
        <h2 className="font-bold mb-3">Add Pastor</h2>

        <input placeholder="Name"
          className="border p-2 w-full mb-2"
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <input placeholder="Joined Year"
          className="border p-2 w-full mb-2"
          onChange={e => setForm({ ...form, joinedYear: e.target.value })}
        />

        <input placeholder="Left Year"
          className="border p-2 w-full mb-2"
          onChange={e => setForm({ ...form, leftYear: e.target.value })}
        />

        <input placeholder="Photo URL"
          className="border p-2 w-full mb-2"
          onChange={e => setForm({ ...form, photo: e.target.value })}
        />

        <textarea placeholder="Details"
          className="border p-2 w-full mb-2"
          onChange={e => setForm({ ...form, details: e.target.value })}
        />

        <button onClick={add} className="bg-green-600 text-white px-4 py-2 rounded">
          Add Pastor
        </button>
      </div>

      {/* LIST */}
      <div className="mt-6 grid gap-3">
        {pastors.map(p => (
          <div key={p._id} className="bg-white p-4 rounded shadow">

            <h2 className="font-bold">{p.name}</h2>
            <p>{p.joinedYear} - {p.leftYear || "Present"}</p>

            {p.isCurrent && (
              <span className="text-green-600 font-bold">CURRENT ⭐</span>
            )}

            <div className="flex gap-2 mt-2">
              <button onClick={() => setCurrent(p._id)} className="bg-blue-500 text-white px-2">
                Set Current
              </button>

              <button onClick={() => del(p._id)} className="bg-red-500 text-white px-2">
                Delete
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}