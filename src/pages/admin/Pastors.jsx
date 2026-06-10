import { useEffect, useState } from "react";
import API from "../../api/axios";

export default function Pastors() {
  const [pastors, setPastors] = useState([]);
  const [search, setSearch] = useState("");

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    color: "#16a34a",
  });

  const [form, setForm] = useState({
    name: "",
    bio: "",
    joinedYear: "",
    leftYear: "",
    number: "",
    active: true,
  });

  const showToast = (
    message,
    color = "#16a34a"
  ) => {
    setToast({
      show: true,
      message,
      color,
    });

    setTimeout(() => {
      setToast({
        show: false,
        message: "",
        color: "#16a34a",
      });
    }, 3000);
  };

  const resetForm = () => {
    setForm({
      name: "",
      bio: "",
      joinedYear: "",
      leftYear: "",
      number: "",
      active: true,
    });

    setEditingId(null);
    setFile(null);
    setPreview("");
  };

  const fetchPastors = async () => {
    try {
      setFetching(true);

      const res = await API.get("/pastors");

      setPastors(
        Array.isArray(res.data?.pastors)
          ? res.data.pastors
          : []
      );
    } catch (err) {
      console.error(err);
      showToast(
        "Failed to fetch pastors",
        "#dc2626"
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPastors();
  }, []);

  const uploadImage = async () => {
    if (!file) return null;

    try {
      const formData = new FormData();

      formData.append("file", file);

      const res = await API.post(
        "/upload/media",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      showToast("Image uploaded");

      return {
        url: res.data.url,
        public_id: res.data.public_id,
      };
    } catch (err) {
      console.error(err);

      showToast(
        "Image upload failed",
        "#dc2626"
      );

      return null;
    }
  };

  const savePastor = async () => {
    try {
      setLoading(true);

      let uploadedImage = null;

      if (file) {
        uploadedImage =
          await uploadImage();
      }

      const payload = {
        name: form.name,
        bio: form.bio,
        joinedYear:
          Number(form.joinedYear) || null,
        leftYear: form.leftYear,
        number: form.number,
        active: form.active,
      };

      if (uploadedImage) {
        payload.image = uploadedImage;
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

        showToast("Pastor updated");
      } else {
        res = await API.post(
          "/pastors",
          payload
        );

        setPastors((prev) => [
          res.data.pastor,
          ...prev,
        ]);

        showToast("Pastor created");
      }

      resetForm();
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message ||
          "Save failed",
        "#dc2626"
      );
    } finally {
      setLoading(false);
    }
  };

  const editPastor = (pastor) => {
    setEditingId(pastor._id);

    setForm({
      name: pastor.name || "",
      bio: pastor.bio || "",
      joinedYear:
        pastor.joinedYear || "",
      leftYear:
        pastor.leftYear || "",
      number: pastor.number || "",
      active:
        pastor.active ?? true,
    });

    setPreview(
      pastor.image?.url ||
        pastor.image ||
        ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    showToast("Editing pastor");
  };

  const deletePastor = async (id) => {
    if (
      !window.confirm(
        "Delete this pastor?"
      )
    )
      return;

    try {
      await API.delete(
        `/pastors/${id}`
      );

      setPastors((prev) =>
        prev.filter(
          (p) => p._id !== id
        )
      );

      showToast("Pastor deleted");
    } catch (err) {
      console.error(err);

      showToast(
        "Delete failed",
        "#dc2626"
      );
    }
  };

  const filtered = pastors.filter(
    (p) =>
      (p.name || "")
        .toLowerCase()
        .includes(
          search.toLowerCase()
        ) ||
      (p.bio || "")
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
  );

  return (
    <div>

      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            background:
              toast.color,
            color: "#fff",
            padding:
              "12px 18px",
            borderRadius: 8,
            zIndex: 9999,
            fontWeight: 600,
          }}
        >
          {toast.message}
        </div>
      )}

      <h2>
        {editingId
          ? "Edit Pastor"
          : "Add Pastor"}
      </h2>

      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) =>
          setForm({
            ...form,
            name: e.target.value,
          })
        }
      />

      <textarea
        placeholder="Bio"
        value={form.bio}
        onChange={(e) =>
          setForm({
            ...form,
            bio: e.target.value,
          })
        }
      />

      <input
        type="file"
        onChange={(e) => {
          const selected =
            e.target.files[0];

          setFile(selected);

          if (selected) {
            setPreview(
              URL.createObjectURL(
                selected
              )
            );
          }
        }}
      />

      {preview && (
        <img
          src={preview}
          alt="preview"
          style={{
            width: 150,
            height: 150,
            objectFit: "cover",
            borderRadius: 10,
            marginTop: 10,
            display: "block",
          }}
        />
      )}

      <button
        onClick={savePastor}
      >
        {loading
          ? editingId
            ? "Updating..."
            : "Adding..."
          : editingId
          ? "Update Pastor"
          : "Add Pastor"}
      </button>

      {editingId && (
        <button
          onClick={resetForm}
        >
          Cancel Edit
        </button>
      )}

      <hr />

      <input
        placeholder="Search..."
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
      />

      {fetching && (
        <p>Loading...</p>
      )}

      {filtered.map((p) => (
        <div
          key={p._id}
          style={{
            display: "flex",
            gap: 15,
            marginBottom: 15,
          }}
        >
          <img
            src={
              p.image?.url ||
              p.image ||
              "https://via.placeholder.com/60"
            }
            alt=""
            width="60"
            height="60"
          />

          <div>
            <h3>{p.name}</h3>
            <p>{p.bio}</p>

            <button
              onClick={() =>
                editPastor(p)
              }
            >
              Edit
            </button>

            <button
              onClick={() =>
                deletePastor(
                  p._id
                )
              }
            >
              Delete
            </button>
          </div>
        </div>
      ))}
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

cancel: {
  width: "100%",
  padding: 10,
  marginTop: 10,
  background: "#6b7280",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
},

};
