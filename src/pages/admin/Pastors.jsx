import { useEffect, useState } from "react";
import axios from "axios";

const API = "/api/pastors";
const UPLOAD_API = "/api/upload/image";

const initialForm = {
  name: "",
  joinedYear: "",
  leftYear: "",
  photo: "",  
  details: ""
};

export default function Pastors() {
  const [pastors, setPastors] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ---------------- LOAD ----------------
  const load = async () => {
    const res = await axios.get(API);
    setPastors(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  // ---------------- POPUP ----------------
  const showPopup = (msg) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // ---------------- IMAGE UPLOAD ----------------
  const uploadImage = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await fetch(UPLOAD_API, {
      method: "POST",
      body: formData
    });

    return await res.json();
  };

  // ---------------- ADD / UPDATE ----------------
  const add = async () => {
    try {
      let imageData = null;

      // FILE UPLOAD
      if (imageFile) {
        const uploaded = await uploadImage();

        imageData = {
          url: uploaded.url,
          public_id: uploaded.public_id
        };
      }

      // URL FALLBACK
      else if (form.photo) {
        imageData = {
          url: form.photo,
          public_id: null
        };
      }

      const payload = {
        name: form.name,
        joinedYear: form.joinedYear,
        leftYear: form.leftYear,
        details: form.details,
        image: imageData
      };

      if (editingId) {
        await axios.put(`${API}/${editingId}`, payload);
        showPopup("Pastor updated successfully");
      } else {
        await axios.post(API, payload);
        showPopup("Pastor added successfully");
      }

      // RESET
      setEditingId(null);
      setImageFile(null);
      setForm(initialForm);

      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Operation failed");
    }
  };

  // ---------------- ACTIONS ----------------
  const setCurrent = async (id) => {
    await axios.put(`${API}/current/${id}`);
    showPopup("Current pastor updated");
    load();
  };

  const del = async (id) => {
    if (!window.confirm("Delete this pastor?")) return;

    await axios.delete(`${API}/${id}`);
    showPopup("Pastor deleted");
    load();
  };

  // ---------------- IMAGE SAFE HANDLER (NO FLICKER FIX) ----------------
  const getImage = (p) => {
    const url = p?.image?.url || p?.photo;
    return url && url.trim() !== "" ? url : "/placeholder.png";
  };

  return (
    <div className="p-6">

      {/* POPUP */}
      {showSuccess && (
        <div className="fixed top-5 right-5 z-50">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg">
            {successMessage}
          </div>
        </div>
      )}

      {/* FORM */}
      <div className="bg-white p-4 rounded-xl shadow max-w-md">

        <h2 className="font-bold mb-3 text-xl">
          {editingId ? "Edit Pastor" : "Add Pastor"}
        </h2>

        <input
          placeholder="Name"
          value={form.name}
          className="border p-2 w-full mb-2 rounded"
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Joined Year"
          value={form.joinedYear}
          className="border p-2 w-full mb-2 rounded"
          onChange={(e) =>
            setForm({ ...form, joinedYear: e.target.value })
          }
        />

        <input
          placeholder="Left Year"
          value={form.leftYear}
          className="border p-2 w-full mb-2 rounded"
          onChange={(e) =>
            setForm({ ...form, leftYear: e.target.value })
          }
        />

        {/* IMAGE */}
        <div className="border p-3 rounded mb-2">

          <p className="font-semibold mb-2">
            Pastor Photo (Upload OR URL)
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0])}
            className="mb-2"
          />

          <input
            placeholder="Or paste image URL"
            value={form.photo}
            className="border p-2 w-full rounded"
            onChange={(e) =>
              setForm({ ...form, photo: e.target.value })
            }
          />
        </div>

        <textarea
          placeholder="Details"
          value={form.details}
          className="border p-2 w-full mb-2 rounded"
          rows="4"
          onChange={(e) =>
            setForm({ ...form, details: e.target.value })
          }
        />

        <button
          onClick={add}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          {editingId ? "Update Pastor" : "Add Pastor"}
        </button>
      </div>

      {/* LIST */}
      <div className="mt-6 grid gap-3">

        {pastors.map((p) => (
          <div
            key={p._id}
            className="bg-white p-4 rounded shadow"
          >

            <h2 className="font-bold text-lg">{p.name}</h2>

            <p>
              {p.joinedYear} - {p.leftYear || "Present"}
            </p>

            {/* IMAGE (NO FLICKER FIX) */}
            <img
              src={getImage(p)}
              alt={p.name}
              className="w-24 h-24 object-cover rounded mt-2"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder.png";
              }}
            />

            {p.isCurrent && (
              <div className="text-green-600 font-bold my-2">
                CURRENT ⭐
              </div>
            )}

            <div className="flex gap-2 mt-3 flex-wrap">

              <button
                onClick={() => {
                  setEditingId(p._id);
                  setForm({
                    name: p.name || "",
                    joinedYear: p.joinedYear || "",
                    leftYear: p.leftYear || "",
                    photo: p.photo || "",
                    details: p.details || ""
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                Edit
              </button>

              <button
                onClick={() => setCurrent(p._id)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Set Current
              </button>

              <button
                onClick={() => del(p._id)}
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
