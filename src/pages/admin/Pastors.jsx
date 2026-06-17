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
const [selectedPastor, setSelectedPastor] = useState(null);
  // ---------------- FILTER (CRASH SAFE) ----------------
const filteredPastors = (pastors || []).filter((p) => {
  const name = p?.name || "";

  const matchesSearch = name
    .toLowerCase()
    .includes((search || "").toLowerCase());

  if (view === "current")
    return p?.isCurrent === true && matchesSearch;

  if (view === "former")
    return p?.isCurrent !== true && matchesSearch;

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
  name: form.name,
  role: form.role,
  bio: form.bio,
  joinedYear: Number(form.joinedYear),
  leftYear: form.endYear ? Number(form.endYear) : null,
 education: [
  ...educations.filter(
    (e) => e && e !== "Other"
  ),
  ...(customEducation
    ? [customEducation]
    : []),
],
  church: form.church,
  email: form.email,
  number: form.phone,
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
     isCurrent: p?.isCurrent ?? false,
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
  const [educations, setEducations] = useState([""]);
const [customEducation, setCustomEducation] = useState("");
const educationOptions = [
  "B.Th (Bachelor of Theology)",
  "B.D (Bachelor of Divinity)",
  "M.Div (Master of Divinity)",
  "M.Th (Master of Theology)",
  "D.Min (Doctor of Ministry)",
  "Ph.D Theology",
  "Dip.Th (Diploma in Theology)",
  "B.A Theology",
  "M.A Theology",
  "Other",
];

  // ---------------- UI ----------------
  return (
  <div className="min-h-screen bg-gray-50 px-3 md:px-6 py-4">

    {/* HEADER */}
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 max-w-7xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold">
        Pastors Management
      </h1>

      <input
        className="border p-2 rounded w-full md:w-72"
        placeholder="Search pastor..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>

    {/* TABS */}
    <div className="flex flex-wrap gap-3 mb-6 max-w-7xl mx-auto">
      <button
        onClick={() => setView("current")}
        className={`px-4 py-2 rounded ${
          view === "current"
            ? "bg-green-600 text-white"
            : "bg-white"
        }`}
      >
        Current Pastors
      </button>

      <button
        onClick={() => setView("former")}
        className={`px-4 py-2 rounded ${
          view === "former"
            ? "bg-gray-700 text-white"
            : "bg-white"
        }`}
      >
        Pastor's List
      </button>
    </div>

    {/* FORM CONTAINER (FIXED WIDTH ISSUE) */}
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-7xl mx-auto"
    >
      {/* keep your inputs same */}
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

  <div className="md:col-span-3 space-y-3">
  <label className="font-semibold">
    Educational Qualifications
  </label>

  {educations.map((edu, index) => (
    <div key={index} className="flex gap-2">
      <select
        value={edu}
        onChange={(e) => {
          const updated = [...educations];
          updated[index] = e.target.value;
          setEducations(updated);
        }}
        className="border p-2 rounded flex-1"
      >
        <option value="">Select Degree</option>

        {educationOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {educations.length > 1 && (
        <button
          type="button"
          onClick={() =>
            setEducations(
              educations.filter((_, i) => i !== index)
            )
          }
          className="bg-red-500 text-white px-3 rounded"
        >
          ×
        </button>
      )}
    </div>
  ))}

  {/* Custom Degree */}
  {educations.includes("Other") && (
    <input
      type="text"
      placeholder="Enter Custom Degree"
      value={customEducation}
      onChange={(e) =>
        setCustomEducation(e.target.value)
      }
      className="border p-2 rounded w-full"
    />
  )}

  <button
    type="button"
    onClick={() =>
      setEducations([...educations, ""])
    }
    className="bg-green-600 text-white px-4 py-2 rounded"
  >
    + Add Additional Education
  </button>
</div>

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

    {/* LIST (FIXED DESKTOP SPACING ISSUE) */}
    {loading ? (
      <p className="text-center">Loading...</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
        {filteredPastors.map((p) => (
          <div
            key={p?._id}
            className={`bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border-2 ${
              p?.isCurrent ? "border-green-500" : "border-transparent"
            }`}
          >
            <img
              src={p?.image?.url || "/default.png"}
              alt={p?.name}
              className="h-52 w-full object-cover"
            />

            <div className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl">{p?.name}</h2>

                {p?.isCurrent && (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                    Current
                  </span>
                )}
              </div>

              <p className="text-gray-600 mt-1">{p?.role}</p>

              <p className="text-sm text-gray-500 mt-2">
                {p?.joinedYear} - {p?.endYear || "Present"}
              </p>

              <div className="flex flex-wrap gap-3 mt-5">
                <button
  onClick={() => setSelectedPastor(p)}
  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm"
>
  View
</button>

<button
  onClick={() => handleEdit(p)}
  className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm"
>
  Edit
</button>

<button
  onClick={() => handleDelete(p._id)}
  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
>
  Delete
</button>

                {p?.isCurrent ? (
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
                    ⭐ Pastor Now
                  </button>
                ) : (
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                    Set Current
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
    {selectedPastor && (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">

      <div className="relative">
        <img
          src={selectedPastor?.image?.url || "/default.png"}
          alt={selectedPastor?.name}
          className="w-full h-80 object-cover"
        />

        <button
          onClick={() => setSelectedPastor(null)}
          className="absolute top-4 right-4 bg-red-600 text-white w-10 h-10 rounded-full"
        >
          ×
        </button>
      </div>

      <div className="p-6">

        <h2 className="text-3xl font-bold">
          {selectedPastor?.name}
        </h2>

        <p className="text-lg text-gray-600">
          {selectedPastor?.role}
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-6">

          <div>
            <p className="font-semibold">Church</p>
            <p>{selectedPastor?.church || "-"}</p>
          </div>

          <div>
            <p className="font-semibold">Years Served</p>
            <p>
              {selectedPastor?.joinedYear} -
              {" "}
              {selectedPastor?.leftYear || "Present"}
            </p>
          </div>

          <div>
            <p className="font-semibold">Email</p>
            <p>{selectedPastor?.email || "-"}</p>
          </div>

          <div>
            <p className="font-semibold">Phone</p>
            <p>{selectedPastor?.number || "-"}</p>
          </div>

        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">
            Education
          </h3>

          {Array.isArray(selectedPastor?.education) ? (
            <ul className="list-disc ml-5">
              {selectedPastor.education.map((edu, i) => (
                <li key={i}>{edu}</li>
              ))}
            </ul>
          ) : (
            <p>{selectedPastor?.education || "-"}</p>
          )}
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">
            Biography
          </h3>

          <p className="text-gray-700 whitespace-pre-wrap">
            {selectedPastor?.bio || "No biography available"}
          </p>
        </div>

      </div>
    </div>
  </div>
)}
  </div>
)}