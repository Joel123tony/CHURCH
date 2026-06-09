import { useState } from "react";
import API from "../../api/axios";

export default function UploadPanel({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [joinedYear, setJoinedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  /* ================= FILE CHANGE ================= */
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);

    if (selected) {
      setPreview(URL.createObjectURL(selected));
    }
  };

  /* ================= UPLOAD TO BACKEND (FIXED ROUTE) ================= */
  const uploadToCloudinary = async () => {
    if (!file) {
      alert("Please select a file");
      return null;
    }

    const formData = new FormData();
    formData.append("file", file); // MUST MATCH multer.single("file")

    try {
      const res = await API.post("/upload/media", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return res.data; // { url, public_id, type }
    } catch (err) {
      console.log("Upload error:", err.response?.data || err.message);
      alert("Upload failed");
      return null;
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const upload = await uploadToCloudinary();

      if (!upload) return;

      const payload = {
        name,
        joinedYear,
        active: true,
        image: {
          url: upload.url,
          public_id: upload.public_id,
        },
      };

      const res = await API.post("/pastors", payload);

      // 🔥 instant UI update
      if (onSuccess) {
        onSuccess(res.data.pastor);
      }

      // RESET FORM
      setFile(null);
      setPreview(null);
      setName("");
      setJoinedYear("");

      alert("Pastor uploaded successfully!");

    } catch (err) {
      console.log("Submit error:", err.response?.data || err.message);
      alert("Failed to save pastor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3>Upload Pastor</h3>

      <input
        placeholder="Pastor Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={styles.input}
      />

      <input
        placeholder="Joined Year"
        value={joinedYear}
        onChange={(e) => setJoinedYear(e.target.value)}
        style={styles.input}
      />

      <input type="file" onChange={handleFileChange} />

      {/* PREVIEW */}
      {preview && (
        <div style={{ marginTop: 10 }}>
          {file?.type?.startsWith("video") ? (
            <video
              src={preview}
              controls
              style={{ width: "100%", borderRadius: 8 }}
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              style={{ width: "100%", borderRadius: 8 }}
            />
          )}
        </div>
      )}

      <button onClick={handleSubmit} style={styles.btn} disabled={loading}>
        {loading ? "Uploading..." : "Upload Pastor"}
      </button>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  card: {
    background: "#fff",
    padding: 15,
    borderRadius: 10,
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
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
};