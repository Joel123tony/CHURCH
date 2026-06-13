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

  /* =========================
     FETCH
  ========================= */
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

  /* =========================
     UPLOAD SUCCESS
  ========================= */
  const handleUploadSuccess = (newItems) => {
    setMedia((prev) => [...newItems, ...prev]);
  };

  /* =========================
     DELETE
  ========================= */
  const deleteMedia = async (id) => {
    const ok = window.confirm(
      "Delete this media?"
    );

    if (!ok) return;

    try {
      await API.delete(`/gallery/${id}`);

      setMedia((prev) =>
        prev.filter(
          (item) => item._id !== id
        )
      );
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  /* =========================
     TOGGLE HOMEPAGE GALLERY
  ========================= */
  const toggleGallery = async (id) => {
    try {
      const res = await API.patch(
        `/gallery/toggle-client/${id}`
      );

      const updated =
        res?.data?.data;

      setMedia((prev) =>
        prev.map((item) =>
          item._id === updated._id
            ? updated
            : item
        )
      );
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Update failed"
      );
    }
  };

  /* =========================
     OPEN EDIT
  ========================= */
  const openEdit = (item) => {
    setEditItem(item);

    setTitle(item.title || "");

    setEventDate(
      item.eventDate
        ? new Date(item.eventDate)
            .toISOString()
            .split("T")[0]
        : ""
    );
  };

  /* =========================
     SAVE EDIT
  ========================= */
  const saveEdit = async () => {
    try {
      const res = await API.put(
        `/gallery/${editItem._id}`,
        {
          title,
          eventDate,
        }
      );

      const updated =
        res?.data?.data;

      setMedia((prev) =>
        prev.map((item) =>
          item._id === updated._id
            ? updated
            : item
        )
      );

      setEditItem(null);
      setTitle("");
      setEventDate("");
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Update failed"
      );
    }
  };

  /* =========================
     SEARCH
  ========================= */
  const filteredMedia =
    media.filter((item) =>
      item.title
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );

  /* =========================
     HOMEPAGE COUNT
  ========================= */
  const galleryCount =
    media.filter(
      (item) =>
        item.clientPriority !== null
    ).length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          Gallery CMS
        </h1>

        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
          Homepage Gallery:{" "}
          {galleryCount}/4
        </div>
      </div>

      {/* UPLOAD */}
      <div className="bg-white rounded-xl shadow p-5">
        <GalleryUpload
          onSuccess={
            handleUploadSuccess
          }
        />
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by title..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        className="w-full border rounded-lg p-3"
      />

      {/* LOADING */}
      {loading && (
        <div className="text-gray-500">
          Loading gallery...
        </div>
      )}

      {/* EMPTY */}
      {!loading &&
        filteredMedia.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center text-gray-500">
            No media found
          </div>
        )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredMedia.map((item) => (
          <div
            key={item._id}
            className="relative"
          >
            {/* GALLERY BADGE */}
            {item.clientPriority !==
              null && (
              <div className="absolute z-20 top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                Gallery #
                {item.clientPriority}
              </div>
            )}

            <MediaCard
              item={item}
              onDelete={
                deleteMedia
              }
              onEdit={openEdit}
            />

            {/* GALLERY BUTTON */}
            <div className="mt-2">
              <button
                onClick={() =>
                  toggleGallery(
                    item._id
                  )
                }
                className={
                  item.clientPriority !==
                  null
                    ? "w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    : "w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600"
                }
              >
                {item.clientPriority !==
                null
                  ? "Remove From Gallery"
                  : "Show In Gallery"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* =========================
          EDIT MODAL
      ========================= */}
      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">
              Edit Media
            </h2>

            {/* TITLE */}
            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder="Title"
              className="w-full border rounded-lg p-3"
            />

            {/* DATE */}
            <input
              type="date"
              value={eventDate}
              onChange={(e) =>
                setEventDate(
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3"
            />

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setEditItem(null)
                }
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