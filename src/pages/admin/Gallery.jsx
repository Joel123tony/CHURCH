import { useEffect, useState } from "react";
import API from "../../api/axios";
import MediaCard from "../../components/MediaCard";
import GalleryUpload from "./GalleryUpload";


export default function Gallery() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     FETCH MEDIA
  ========================== */
  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await API.get("/gallery");
      setMedia(res.data.media || []);
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  /* =========================
     DELETE MEDIA
  ========================== */
  const deleteMedia = async (id) => {
    try {
      await API.delete(`/gallery/${id}`);
      setMedia((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.log("Delete error:", err);
    }
  };

  /* =========================
     AFTER UPLOAD
  ========================== */
  const handleUpload = async (uploadRes) => {
    try {
      const payload = {
        title: "Untitled",
        url: uploadRes.url,
        public_id: uploadRes.public_id,
        mediaType: uploadRes.url.includes("video") ? "video" : "image",
        showInClient: false,
      };

      const res = await API.post("/gallery", payload);

      setMedia((prev) => [res.data.item, ...prev]);
    } catch (err) {
      console.log("Upload save error:", err);
    }
  };

  return (
    <div className="p-4 space-y-6">

      {/* ================= HEADER ================= */}
      <h1 className="text-xl font-bold">Gallery Admin</h1>

      {/* ================= UPLOAD ZONE ================= */}
      <GalleryUpload onUpload={handleUpload} />

      {/* ================= LOADING ================= */}
      {loading && (
        <p className="text-sm text-gray-500">Loading gallery...</p>
      )}

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {media.map((item) => (
          <MediaCard
            key={item._id}
            item={item}
            onDelete={deleteMedia}
            onEdit={(item) => console.log("edit", item)}
          />
        ))}

      </div>
    </div>
  );
}