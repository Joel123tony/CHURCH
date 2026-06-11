import { useEffect, useState } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";

const defaultForm = {
  name: "",
  role: "Pastor",
  bio: "",
  joinedYear: "",
  endYear: "",
  education: "",
  church: "Methodist Tamil Church Padikuppam",
  email: "",
  phone: "",
  isActive: true,
};

export default function Pastors() {
  const [pastors, setPastors] = useState([]);
  const [view, setView] = useState("current");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(false);

  // ---------------- FETCH ----------------
  const fetchPastors = async () => {
    try {
      setLoading(true);

      const res = await API.get("/pastors");

      // ✅ SAFE NORMALIZATION (FIX FOR YOUR CRASH)
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.pastors || [];

      setPastors(data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load pastors");
      setPastors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPastors();
  }, []);

  // ---------------- FILTER (CRASH SAFE) ----------------
  const filteredPastors = (pastors || []).filter((p) => {
    const name = p?.name || "";

    const matchesSearch = name
      .toLowerCase()
      .includes((search || "").toLowerCase());

    if (view === "current") return p?.isActive && matchesSearch;
    if (view === "former") return !p?.isActive && matchesSearch;

    return matchesSearch;
  });

  // ---------------- INPUT ----------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ---------------- IMAGE ----------------
  const handleImage = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  // ---------------- CLOUDINARY ----------------
  const uploadImage = async () => {
    if (!file) return "";

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "pastors_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dhqc0n23k/image/upload",
      {
        method: "POST",
        body: data,
      }
    );

    const result = await res.json();
    return result?.secure_url || "";
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const imageUrl = await uploadImage();

      const payload = {
        ...form,
        image: imageUrl ? { url: imageUrl } : undefined,
      };

      if (editId) {
        await API.put(`/pastors/${editId}`, payload);
        toast.success("Pastor updated");
      } else {
        await API.post("/pastors", payload);
        toast.success("Pastor added");
      }

      setForm(defaultForm);
      setEditId(null);
      setFile(null);
      setPreview(null);

      fetchPastors();
    } catch (err) {
      console.log(err);
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- EDIT ----------------
  const handleEdit = (p) => {
    setEditId(p?._id);

    setForm({
      name: p?.name || "",
      role: p?.role || "Pastor",
      bio: p?.bio || "",
      joinedYear: p?.joinedYear || "",
      endYear: p?.endYear || "",
      education: p?.education || "",
      church: p?.church || "",
      email: p?.email || "",
      phone: p?.phone || "",
      isActive: p?.isActive ?? true,
    });

    setPreview(p?.image?.url || null);
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this pastor?")) return;

    try {
      await API.delete(`/pastors/${id}`);
      toast.success("Deleted");
      fetchPastors();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pastors Management</h1>

        <input
          className="border p-2 rounded w-64"
          placeholder="Search pastor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABS */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setView("current")}
          className={`px-4 py-2 rounded ${
            view === "current" ? "bg-green-600 text-white" : "bg-white"
          }`}
        >
          Current Pastors
        </button>

        <button
          onClick={() => setView("former")}
          className={`px-4 py-2 rounded ${
            view === "former" ? "bg-gray-700 text-white" : "bg-white"
          }`}
        >
          Pastor's List
        </button>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow mb-6 grid md:grid-cols-3 gap-3"
      >
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option>Pastor</option>
          <option>Senior Pastor</option>
          <option>Associate Pastor</option>
          <option>Youth Pastor</option>
          <option>Worship Pastor</option>
          <option>Other</option>
        </select>

        <input
          name="education"
          placeholder="Education"
          value={form.education}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="joinedYear"
          placeholder="Joined Year"
          value={form.joinedYear}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <input
          name="endYear"
          placeholder="End Year"
          value={form.endYear}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <textarea
          name="bio"
          placeholder="Bio"
          value={form.bio}
          onChange={handleChange}
          className="border p-2 rounded md:col-span-3"
        />

        <input type="file" onChange={handleImage} className="md:col-span-3" />
{preview && (
  <div className="relative w-fit">

    <img
      src={preview}
      className="w-32 h-32 rounded-xl object-cover"
    />

    <button
      type="button"
      onClick={() => {
        setPreview(null);
        setFile(null);
      }}
      className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full"
    >
      ×
    </button>

  </div>
)}

      

        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded md:col-span-3"
        >
          {editId ? "Update Pastor" : "Add Pastor"}
        </button>
      </form>

      {/* LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {filteredPastors.map((p) => (
            <div key={p?._id} className="bg-white shadow rounded overflow-hidden">

              <img
                src={p?.image?.url || "/default.png"}
                className="h-40 w-full object-cover"
              />

              <div className="p-3">
                <h2 className="font-bold">{p?.name}</h2>
                <p className="text-sm text-gray-600">{p?.role}</p>

                <p className="text-xs mt-1">
                  {p?.joinedYear} - {p?.endYear || "Present"}
                </p>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(p)}
                    className="bg-yellow-500 px-2 py-1 text-white rounded text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(p?._id)}
                    className="bg-red-500 px-2 py-1 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
                <button
  onClick={async () => {
    await API.put(`/pastors/current/${p._id}`);
    fetchPastors();
    toast.success("Current pastor updated");
  }}
  className="bg-green-600 text-white px-2 py-1 rounded text-sm"
>
  Set Current
</button>

                {p?.isActive && (
                  <span className="text-green-600 text-xs font-bold">
                    ● Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}