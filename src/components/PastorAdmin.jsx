import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/pastors";

export default function PastorAdmin() {
  const [pastors, setPastors] = useState([]);

  const [form, setForm] = useState({
    name: "",
    joinedYear: "",
    leftYear: "",
    photo: "",
    details: "",
  });

  const fetchPastors = async () => {
    const res = await axios.get(API);
    setPastors(res.data);
  };

  useEffect(() => {
    fetchPastors();
  }, []);

  const addPastor = async () => {
    await axios.post(API, form);
    setForm({
      name: "",
      joinedYear: "",
      leftYear: "",
      photo: "",
      details: "",
    });
    fetchPastors();
  };

  const setCurrent = async (id) => {
    await axios.put(`${API}/current/${id}`);
    fetchPastors();
  };

  const remove = async (id) => {
    await axios.delete(`${API}/${id}`);
    fetchPastors();
  };

  return (
    <div>

      <h2 className="text-3xl font-bold text-primary mb-6">
        Pastor Management
      </h2>

      <div className="grid lg:grid-cols-2 gap-8">

        {/* FORM */}
        <div className="bg-white p-6 rounded-2xl shadow space-y-3">

          <input
            className="w-full p-2 border rounded"
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            className="w-full p-2 border rounded"
            placeholder="Joined Year"
            type="number"
            value={form.joinedYear}
            onChange={(e) =>
              setForm({ ...form, joinedYear: e.target.value })
            }
          />

          <input
            className="w-full p-2 border rounded"
            placeholder="Left Year"
            type="number"
            value={form.leftYear}
            onChange={(e) =>
              setForm({ ...form, leftYear: e.target.value })
            }
          />

          <input
            className="w-full p-2 border rounded"
            placeholder="Photo URL"
            value={form.photo}
            onChange={(e) =>
              setForm({ ...form, photo: e.target.value })
            }
          />

          <textarea
            className="w-full p-2 border rounded"
            placeholder="Details"
            value={form.details}
            onChange={(e) =>
              setForm({ ...form, details: e.target.value })
            }
          />

          <button
            onClick={addPastor}
            className="w-full bg-primary text-white py-2 rounded-full"
          >
            Add Pastor
          </button>

        </div>

        {/* LIST */}
        <div className="space-y-4">

          {pastors.map((p) => (
            <div
              key={p._id}
              className="bg-white p-4 rounded-2xl shadow"
            >

              <h3 className="font-bold text-lg text-primary">
                {p.name}
              </h3>

              <p className="text-sm text-gray-600">
                {p.joinedYear} - {p.leftYear || "Present"}
              </p>

              <p className="text-gray-700 text-sm mt-2">
                {p.details}
              </p>

              {p.isCurrent && (
                <span className="inline-block mt-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                  Current Pastor ⭐
                </span>
              )}

              <div className="flex gap-2 mt-3">

                <button
                  onClick={() => setCurrent(p._id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Set Current
                </button>

                <button
                  onClick={() => remove(p._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>

              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}