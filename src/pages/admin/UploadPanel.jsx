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
    <div className="rounded-[10px] bg-white p-[15px] shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <h3>Upload Pastor</h3>

      <input
        placeholder="Pastor Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-[10px] w-full rounded-md border border-[#ccc] p-[10px]"
      />

      <input
        placeholder="Joined Year"
        value={joinedYear}
        onChange={(e) => setJoinedYear(e.target.value)}
        className="mb-[10px] w-full rounded-md border border-[#ccc] p-[10px]"
      />

      <input type="file" onChange={handleFileChange} />

      {/* PREVIEW */}
      {preview && (
        <div className="mt-[10px]">
          {file?.type?.startsWith("video") ? (
            <video
              src={preview}
              controls
              className="w-full rounded-lg"
            />
          ) : (
            <img
              src={preview}
              alt="preview"
              className="w-full rounded-lg"
            />
          )}
        </div>
      )}

      <button 
        onClick={handleSubmit} 
        className="mt-2 w-full cursor-pointer rounded-md border-none bg-[#16a34a] p-[10px] text-white" 
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload Pastor"}
      </button>
    </div>
  );
}