import { useEffect, useState } from "react";
import API from "../../api/axios";
import GalleryUpload from "./GalleryUpload";
import MediaCard from "../../components/MediaCard";

export default function Gallery() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState(null);

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");

  /* FETCH */
  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await API.get("/gallery");
      setMedia(res?.data?.data || []);
    } catch (err) {
      console.error(err);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  /* UPLOAD SUCCESS */
  const handleUploadSuccess = (newItems) => {
    setMedia((prev) => [...newItems, ...prev]);
  };

  /* DELETE */
  const deleteMedia = async (id) => {
    const ok = window.confirm("Delete this media?");
    if (!ok) return;

    try {
      await API.delete(`/gallery/${id}`);
      setMedia((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  /* TOGGLE GALLERY */
  const toggleGallery = async (id) => {
    try {
      const res = await API.patch(`/gallery/toggle-client/${id}`);
      const updated = res?.data?.data;

      setMedia((prev) =>
        prev.map((item) =>
          item._id === updated._id ? updated : item
        )
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Update failed");
    }
  };

  /* EDIT OPEN */
  const openEdit = (item) => {
    setEditItem(item);
    setTitle(item.title || "");
    setEventDate(
      item.eventDate
        ? new Date(item.eventDate).toISOString().split("T")[0]
        : ""
    );
  };

  /* SAVE EDIT */
  const saveEdit = async () => {
    try {
      const res = await API.put(`/gallery/${editItem._id}`, {
        title,
        eventDate,
      });

      const updated = res?.data?.data;

      setMedia((prev) =>
        prev.map((item) =>
          item._id === updated._id ? updated : item
        )
      );

      setEditItem(null);
      setTitle("");
      setEventDate("");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Update failed");
    }
  };

  /* SEARCH */
  const filteredMedia = media.filter((item) =>
    item.title?.toLowerCase().includes(search.toLowerCase())
  );

  const galleryCount = media.filter(
    (item) => item.clientPriority !== null
  ).length;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Gallery CMS
        </h1>

        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium w-fit">
          Homepage Gallery: {galleryCount}/4
        </div>
      </div>

      {/* UPLOAD */}
      <div className="bg-white rounded-xl shadow p-4 sm:p-5">
        <GalleryUpload onSuccess={handleUploadSuccess} />
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-xl p-3"
      />

      {/* LOADING */}
      {loading && (
        <div className="text-gray-500">Loading gallery...</div>
      )}

      {/* EMPTY */}
      {!loading && filteredMedia.length === 0 && (
        <div className="bg-white rounded-xl p-8 sm:p-10 text-center text-gray-500">
          No media found
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {filteredMedia.map((item) => (
          <div key={item._id} className="relative flex flex-col">

            {/* BADGE */}
            {item.clientPriority !== null && (
              <div className="absolute z-20 top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                Gallery #{item.clientPriority}
              </div>
            )}

            <MediaCard
              item={item}
              onDelete={deleteMedia}
              onEdit={openEdit}
            />

            {/* BUTTON */}
            <button
              onClick={() => toggleGallery(item._id)}
              className={`mt-2 w-full py-2 rounded-lg text-white text-sm ${
                item.clientPriority !== null
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              {item.clientPriority !== null
                ? "Remove From Gallery"
                : "Show In Gallery"}
            </button>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md space-y-4">

            <h2 className="text-xl font-bold">Edit Media</h2>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full border rounded-lg p-3"
            />

            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full border rounded-lg p-3"
            />

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setEditItem(null)}
                className="px-4 py-2 rounded bg-gray-400 text-white"
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded bg-blue-600 text-white"
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