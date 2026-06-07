import { useEffect, useState } from "react";
import axios from "axios";

const API = "/api/pastors";
const UPLOAD_API = "/api/upload/image";

export default function PastorAdmin() {
  const [pastors, setPastors] = useState([]);

  // FORM STATE (clean + single source of truth)
  const [form, setForm] = useState({
    name: "",
    joinedYear: "",
    leftYear: "",
    details: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  // FETCH PASTORS
  const fetchPastors = async () => {
    const res = await axios.get(API);
    setPastors(res.data);
  };

  useEffect(() => {
    fetchPastors();
  }, []);

  // UPLOAD IMAGE TO CLOUDINARY
  const uploadImage = async () => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await fetch(UPLOAD_API, {
      method: "POST",
      body: formData,
    });

    return await res.json();
  };

  // ADD PASTOR (MAIN LOGIC)
  const addPastor = async () => {
    let finalImage = {
      url: "",
      public_id: "",
    };

    // CASE 1: file upload
    if (imageFile) {
      const uploaded = await uploadImage();

      finalImage = {
        url: uploaded.url,
        public_id: uploaded.public_id,
      };
    }

    // CASE 2: URL fallback
    else if (imageUrl) {
      finalImage = {
        url: imageUrl,
        public_id: null,
      };
    }

    const pastorData = {
      ...form,
      image: finalImage,
    };

    await axios.post(API, pastorData);

    // reset form
    setForm({
      name: "",
      joinedYear: "",
      leftYear: "",
      details: "",
    });
    setImageFile(null);
    setImageUrl("");

    fetchPastors();
    alert("Pastor added successfully!");
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

          <textarea
            className="w-full p-2 border rounded"
            placeholder="Details"
            value={form.details}
            onChange={(e) =>
              setForm({ ...form, details: e.target.value })
            }
          />
<div className="border p-3 rounded space-y-3 bg-gray-50">

  <h3 className="font-semibold">
    Pastor Photo Upload
  </h3>

  <p className="text-sm text-gray-600">
    Choose file OR paste image link
  </p>

  {/* FILE UPLOAD */}
  <input
    type="file"
    accept="image/*"
    onChange={(e) => setImageFile(e.target.files[0])}
  />

  <div className="text-center text-gray-400">OR</div>

  {/* URL INPUT */}
  <input
    className="w-full p-2 border rounded"
    type="text"
    placeholder="Paste Image URL (optional)"
    value={imageUrl}
    onChange={(e) => setImageUrl(e.target.value)}
  />

</div>
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

              {p.image?.url && (
                <img
                  src={p.image.url}
                  alt={p.name}
                  className="w-24 h-24 object-cover rounded mt-2"
                />
              )}

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
