import { useEffect, useState } from "react";
import API from "../../api/axios";

export default function Pastors() {
  const [pastors, setPastors] = useState([]);
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    joinedYear: "",
    leftYear: "",
    number: "",
    active: true,
  });

  /* ================= FETCH ================= */
  const fetchPastors = async () => {
    try {
      setFetching(true);
      const res = await API.get("/pastors");

      const data = res.data?.pastors || [];

      setPastors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Fetch error:", err.message);
      setPastors([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPastors();
  }, []);

  /* ================= UPLOAD IMAGE ================= */
  const uploadImage = async () => {
    if (!file) return null;

    try {
      const formData = new FormData();
      formData.append("file", file); // 🔥 MUST BE "file"

      const res = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return {
        url: res.data.url,
        public_id: res.data.public_id,
      };
    } catch (err) {
      console.log("Upload error:", err.message);
      return null;
    }
  };

  /* ================= ADD PASTOR ================= */
  const addPastor = async () => {
    try {
      setLoading(true);

      const imageData = await uploadImage();

      const payload = {
        name: form.name,
        bio: form.bio,
        joinedYear: Number(form.joinedYear) || null,
        leftYear: form.leftYear,
        number: form.number,
        active: form.active,
        image: imageData, // 🔥 FIXED
      };

      const res = await API.post("/pastors", payload);

      // 🔥 INSTANT UI UPDATE
      setPastors((prev) => [res.data.pastor, ...prev]);

      setForm({
        name: "",
        bio: "",
        joinedYear: "",
        leftYear: "",
        number: "",
        active: true,
      });

      setFile(null);

    } catch (err) {
      console.log("ADD ERROR:", err.message);
      alert("Error adding pastor");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const deletePastor = async (id) => {
    try {
      await API.delete(`/pastors/${id}`);

      setPastors((prev) => prev.filter((p) => p._id !== id));

    } catch (err) {
      console.log("DELETE ERROR:", err.message);
    }
  };

  /* ================= FILTER ================= */
  const filtered = pastors.filter((p) =>
    (p?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p?.bio || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Pastor Management System</h1>

      <div style={styles.grid}>
        {/* LEFT FORM */}
        <div style={styles.card}>
          <h3>Add Pastor</h3>

          <input
            style={styles.input}
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <textarea
            style={styles.input}
            placeholder="Bio"
            value={form.bio}
            onChange={(e) =>
              setForm({ ...form, bio: e.target.value })
            }
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            style={styles.input}
          />

          <input
            style={styles.input}
            placeholder="Joined Year"
            value={form.joinedYear}
            onChange={(e) =>
              setForm({ ...form, joinedYear: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Left Year"
            value={form.leftYear}
            onChange={(e) =>
              setForm({ ...form, leftYear: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Phone"
            value={form.number}
            onChange={(e) =>
              setForm({ ...form, number: e.target.value })
            }
          />

          <label>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm({ ...form, active: e.target.checked })
              }
            />
            Active
          </label>

          <button style={styles.btn} onClick={addPastor}>
            {loading ? "Adding..." : "Add Pastor"}
          </button>
        </div>

        {/* RIGHT LIST */}
        <div>
          <input
            style={styles.search}
            placeholder="Search pastors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {fetching && <p>Loading pastors...</p>}

          {filtered.map((p) => (
            <div key={p._id} style={styles.item}>
              <img
                src={p.image?.url || "https://via.placeholder.com/60"}
                style={styles.img}
                alt="pastor"
              />

              <div style={{ flex: 1 }}>
                <h3>{p.name}</h3>
                <p>{p.bio}</p>
                <small>
                  {p.joinedYear} - {p.leftYear || "Present"}
                </small>
              </div>

              <button
                style={styles.delete}
                onClick={() => deletePastor(p._id)}
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}