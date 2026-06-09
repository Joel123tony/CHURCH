import { useEffect, useState } from "react";
import API from "../../api/axios";
import MediaCard from "../../components/MediaCard";
import GalleryUpload from "./GalleryUpload";

export default function Gallery() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     SEARCH
  ========================== */
  const [search, setSearch] = useState("");

  /* =========================
     EDIT MODAL STATE
  ========================== */
  const [editItem, setEditItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [showInClient, setShowInClient] = useState(false);

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
        mediaType: uploadRes.resource_type || "image",
        showInClient: false,
      };

      const res = await API.post("/gallery", payload);

      setMedia((prev) => [res.data.item, ...prev]);
    } catch (err) {
      console.log("Upload save error:", err);
    }
  };

  /* =========================
     OPEN EDIT MODAL
  ========================== */
  const openEdit = (item) => {
    setEditItem(item);
    setEditTitle(item.title);
    setShowInClient(item.showInClient || false);
  };

  /* =========================
     UPDATE MEDIA
  ========================== */
  const updateMedia = async () => {
    try {
      const res = await API.put(`/gallery/${editItem._id}`, {
        title: editTitle,
        showInClient,
      });

      setMedia((prev) =>
        prev.map((item) =>
          item._id === editItem._id ? res.data.item : item
        )
      );

      setEditItem(null);
    } catch (err) {
      console.log("Update error:", err);
    }
  };

  /* =========================
     FILTER MEDIA
  ========================== */
  const filteredMedia = media.filter((item) =>
    item.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6">

      {/* ================= HEADER ================= */}
      <h1 className="text-xl font-bold">Gallery Admin</h1>

      {/* ================= UPLOAD ================= */}
      <GalleryUpload onUpload={handleUpload} />

      {/* ================= SEARCH ================= */}
      <input
        type="text"
        placeholder="Search by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border p-2 rounded"
      />

      {/* ================= LOADING ================= */}
      {loading && (
        <p className="text-gray-500 text-sm">Loading gallery...</p>
      )}

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {filteredMedia.map((item) => (
          <MediaCard
            key={item._id}
            item={item}
            onDelete={deleteMedia}
            onEdit={openEdit}
          />
        ))}

      </div>

      {/* ================= EDIT MODAL ================= */}
      {editItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <div className="bg-white p-5 rounded w-[90%] max-w-md space-y-4">

            <h2 className="text-lg font-bold">Edit Media</h2>

            {/* TITLE */}
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Title"
            />

            {/* SHOW IN CLIENT */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showInClient}
                onChange={(e) => setShowInClient(e.target.checked)}
              />
              Show in Client Page
            </label>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2">

              <button
                onClick={() => setEditItem(null)}
                className="px-3 py-1 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>

              <button
                onClick={updateMedia}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                Save
              </button>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}