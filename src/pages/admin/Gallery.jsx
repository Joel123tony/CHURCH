import { useEffect, useState } from "react";
import API from "../../api/axios";
import MediaCard from "../../components/MediaCard";
import GalleryUpload from "./GalleryUpload";

export default function Gallery() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [editItem, setEditItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [clientPriority, setClientPriority] = useState(null);

  /* ================= FETCH ================= */
  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await API.get("/gallery");
      setMedia(res?.data?.data || []);
    } catch (err) {
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  /* ================= DELETE ================= */
  const deleteMedia = async (id) => {
    try {
      await API.delete(`/gallery/${id}`);
      setMedia((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {}
  };

  /* ================= UPLOAD ================= */
  const handleUpload = async (uploadRes) => {
    try {
      const res = await API.post("/gallery", {
        title: "Untitled",
        url: uploadRes.url,
        public_id: uploadRes.public_id,
        mediaType: uploadRes.resource_type || "image",
        clientPriority: null,
      });

      setMedia((prev) => [res?.data?.data, ...prev]);
    } catch (err) {}
  };

  /* ================= EDIT OPEN ================= */
  const openEdit = (item) => {
    setEditItem(item);
    setEditTitle(item.title || "");
    setClientPriority(item.clientPriority || null);
  };

  /* ================= UPDATE ================= */
  const updateMedia = async () => {
    try {
      const res = await API.put(`/gallery/${editItem._id}`, {
        title: editTitle,
        clientPriority,
      });

      setMedia((prev) =>
        prev.map((i) =>
          i._id === editItem._id ? res?.data?.data : i
        )
      );

      setEditItem(null);
      setEditTitle("");
      setClientPriority(null);
    } catch (err) {
      console.log(err);
    }
  };

  /* ================= FILTER ================= */
  const filtered = (media || []).filter((item) =>
    item.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📸 Gallery CMS</h1>
      </div>

      {/* UPLOAD */}
      <div className="bg-white p-4 rounded-xl shadow">
        <GalleryUpload onUpload={handleUpload} />
      </div>

      {/* SEARCH */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search media..."
        className="w-full p-3 border rounded-lg shadow-sm"
      />

      {/* LOADING */}
      {loading && (
        <p className="text-gray-500">Loading gallery...</p>
      )}

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <div
            key={item._id}
            className="relative group bg-white rounded-xl overflow-hidden shadow hover:shadow-xl transition"
          >
            {/* MEDIA */}
            {item.mediaType === "video" ? (
              <video
                src={item.url}
                className="h-40 w-full object-cover"
              />
            ) : (
              <img
                src={item.url}
                className="h-40 w-full object-cover"
              />
            )}

            {/* BADGE */}
            <span className="absolute top-2 left-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
              {item.mediaType}
            </span>

            {/* HOVER ACTIONS */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">

              <button
                onClick={() => openEdit(item)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Edit
              </button>

              <button
                onClick={() => deleteMedia(item._id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>

            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-md space-y-4">

            <h2 className="text-xl font-bold">Edit Media</h2>

            {/* TITLE */}
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Title"
            />

            {/* HOMEPAGE PRIORITY */}
            <input
              type="number"
              min="1"
              max="4"
              placeholder="Homepage Position (1-4)"
              value={clientPriority || ""}
              onChange={(e) =>
                setClientPriority(Number(e.target.value))
              }
              className="w-full border p-2 rounded"
            />

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
                className="px-3 py-1 bg-blue-600 text-white rounded"
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