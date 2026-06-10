import { useEffect, useState } from "react";
import API from "../../api/axios";

export default function Pastors() {
  const [pastors, setPastors] = useState([]);
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    joinedYear: "",
    leftYear: "",
    number: "",
    active: true,
  });

  /* ================= FETCH PASTORS ================= */
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

  /* ================= UPLOAD IMAGE TO CLOUDINARY ================= */
  const uploadImage = async () => {
  if (!file) {
    console.log("NO FILE SELECTED");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    console.log("FILE:", file);

    const res = await API.post(
      "/upload/media",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("UPLOAD SUCCESS:", res.data);

    return res.data;
  } catch (err) {
    console.error(
      "UPLOAD FAILED:",
      err.response?.data || err.message
    );
    return null;
  }
};
  /* ================= ADD PASTOR ================= */
const addPastor = async () => {
  try {
    setLoading(true);

    const upload = await uploadImage();

    const payload = {
      name: form.name,
      bio: form.bio,
      joinedYear: Number(form.joinedYear) || null,
      leftYear: form.leftYear,
      number: form.number,
      active: form.active,
    };

    // Only attach image if a new image was uploaded
    if (upload) {
      payload.image = {
        url: upload.url,
        public_id: upload.public_id,
      };
    }

    let res;

    if (editingId) {
      res = await API.put(
        `/pastors/${editingId}`,
        payload
      );

      setPastors((prev) =>
        prev.map((p) =>
          p._id === editingId
            ? res.data.pastor
            : p
        )
      );
    } else {
      res = await API.post(
        "/pastors",
        payload
      );

      setPastors((prev) => [
        res.data.pastor,
        ...prev,
      ]);
    }

    setForm({
      name: "",
      bio: "",
      joinedYear: "",
      leftYear: "",
      number: "",
      active: true,
    });

    setFile(null);
    setEditingId(null);

  } catch (err) {
    console.error(
      "SAVE ERROR:",
      err.response?.data || err.message
    );

    alert(
      err.response?.data?.message ||
      "Failed to save pastor"
    );
  } finally {
    setLoading(false);
  }
};


/*=========cancle btn========== */

{editingId && (
  <button
    style={{
      width: "100%",
      padding: 10,
      marginTop: 10,
      background: "#6b7280",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      cursor: "pointer",
    }}
    onClick={() => {
      setEditingId(null);
      setFile(null);

      setForm({
        name: "",
        bio: "",
        joinedYear: "",
        leftYear: "",
        number: "",
        active: true,
      });
    }}
  >
    Cancel Edit
  </button>
)}

  /* ================= DELETE PASTOR ================= */
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
         <h3>
  {editingId ? "Edit Pastor" : "Add Pastor"}
</h3>

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
            {loading
  ? editingId
    ? "Updating..."
    : "Adding..."
  : editingId
  ? "Update Pastor"
  : "Add Pastor"}
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

          {!fetching && filtered.length === 0 && (
            <p>No pastors found</p>
          )}

          {filtered.map((p) => (
            <div key={p._id} style={styles.item}>
              <img
                src={
  p.image?.url ||
  p.image ||
  "https://via.placeholder.com/60"
}
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

             <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  }}
>
  <button
    style={styles.edit}
    onClick={() => editPastor(p)}
  >
    Edit
  </button>

  <button
    style={styles.delete}
    onClick={() => deletePastor(p._id)}
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

/* ================= STYLES ================= */
const styles = {
  page: {
    padding: 20,
    background: "#f4f4f4",
    minHeight: "100vh",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: 20,
  },
  card: {
    background: "#fff",
    padding: 15,
    borderRadius: 10,
  },
  input: {
    width: "100%",
    marginBottom: 10,
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 6,
  },
  btn: {
    width: "100%",
    padding: 10,
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  search: {
    width: "100%",
    padding: 10,
    marginBottom: 15,
  },
  item: {
    display: "flex",
    gap: 10,
    background: "#fff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  img: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    objectFit: "cover",
  },
  delete: {
    background: "red",
    color: "#fff",
    border: "none",
    padding: 8,
    borderRadius: 6,
    cursor: "pointer",
  },

  edit: {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: 8,
  borderRadius: 6,
  cursor: "pointer",
},

};
