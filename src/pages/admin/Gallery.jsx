import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import GalleryUpload from "./GalleryUpload";
import MediaCard from "../../components/MediaCard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Gallery() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

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
  const handleUploadSuccess = useCallback((newItems) => {
    setMedia((prev) => [...newItems, ...prev]);
  }, []);

  /* DELETE */
  const deleteMedia = useCallback(async (id) => {
    const ok = window.confirm("Delete this media?");
    if (!ok) return;

    try {
      await API.delete(`/gallery/${id}`);
      setMedia((prev) => prev.filter((item) => item._id !== id));
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
      toast.success("Media deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  }, []);

  const bulkDeleteMedia = useCallback(async () => {
    if (!selectedItems.length) {
      toast.info("Select at least one media item");
      return;
    }

    const ok = window.confirm(
      `Delete ${selectedItems.length} selected media item(s)?`
    );

    if (!ok) return;

    try {
      await API.delete("/gallery/bulk", {
        data: { ids: selectedItems },
      });

      setMedia((prev) =>
        prev.filter((item) => !selectedItems.includes(item._id))
      );
      setSelectedItems([]);
      toast.success("Selected media deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Bulk delete failed");
    }
  }, [selectedItems]);

  /* TOGGLE GALLERY */
  const toggleGallery = useCallback(async (id) => {
    try {
      const res = await API.patch(`/gallery/toggle-client/${id}`);
      const updated = res?.data?.data;

      setMedia((prev) =>
        prev.map((item) =>
          item._id === updated._id ? updated : item
        )
      );
      toast.success(
        updated?.clientPriority !== null
          ? "Added to homepage gallery"
          : "Removed from homepage gallery"
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  }, []);

  /* EDIT OPEN */
  const openEdit = useCallback((item) => {
    setEditItem(item);
    setTitle(item.title || "");
    setEventDate(
      item.eventDate
        ? new Date(item.eventDate).toISOString().split("T")[0]
        : ""
    );
  }, []);

  const toggleSelection = useCallback((id) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  }, []);

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
      toast.success("Media updated successfully");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  /* SEARCH */
  const filteredMedia = useMemo(
    () =>
      media.filter((item) =>
        item.title?.toLowerCase().includes(search.toLowerCase())
      ),
    [media, search]
  );

  const filteredIds = useMemo(
    () => filteredMedia.map((item) => item._id),
    [filteredMedia]
  );

  const selectedCount = selectedItems.length;
  const selectedSet = useMemo(
    () => new Set(selectedItems),
    [selectedItems]
  );

  const allVisibleSelected = useMemo(() => {
    if (!filteredIds.length) return false;
    return filteredIds.every((id) => selectedSet.has(id));
  }, [filteredIds, selectedSet]);

  const visibleSelectedCount = useMemo(
    () => filteredIds.filter((id) => selectedSet.has(id)).length,
    [filteredIds, selectedSet]
  );

  const toggleSelectAllVisible = useCallback(() => {
    if (!filteredIds.length) return;

    setSelectedItems((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !filteredIds.includes(id));
      }

      return Array.from(new Set([...prev, ...filteredIds]));
    });
  }, [allVisibleSelected, filteredIds]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const { pinnedMedia, regularMedia } = useMemo(() => {
    const pinned = [];
    const regular = [];

    filteredMedia.forEach((item) => {
      if (item.clientPriority !== null && item.clientPriority !== undefined) {
        pinned.push(item);
      } else {
        regular.push(item);
      }
    });

    pinned.sort((a, b) => {
      const aPriority = Number(a.clientPriority) || 0;
      const bPriority = Number(b.clientPriority) || 0;
      return aPriority - bPriority;
    });

    regular.sort((a, b) => {
      const aDate = new Date(a.eventDate || a.createdAt || 0).getTime();
      const bDate = new Date(b.eventDate || b.createdAt || 0).getTime();
      return bDate - aDate;
    });

    return { pinnedMedia: pinned, regularMedia: regular };
  }, [filteredMedia]);

  const galleryCount = useMemo(
    () => media.filter((item) => item.clientPriority !== null).length,
    [media]
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6">
      <ToastContainer
        position="top-right"
        autoClose={1800}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Gallery Management
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

      {filteredMedia.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium text-slate-600">
            {selectedCount > 0 ? (
              <>
                {selectedCount} selected
                {visibleSelectedCount > 0
                  ? ` (${visibleSelectedCount} visible)`
                  : ""}
              </>
            ) : (
              "No items selected"
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleSelectAllVisible}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {allVisibleSelected ? "Unselect All" : "Select All"}
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="rounded-lg bg-slate-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
            >
              Clear Selection
            </button>

            <button
              type="button"
              onClick={bulkDeleteMedia}
              disabled={!selectedCount}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

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
      {filteredMedia.length > 0 && (
        <div className="space-y-6">
          {pinnedMedia.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                  Homepage Gallery
                </h2>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  {pinnedMedia.length} pinned
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {pinnedMedia.map((item, index) => (
                  <div
                    key={item._id}
                    className="animate-admin-card-in relative flex flex-col"
                    style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
                  >
                    <div className="absolute z-20 top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      Gallery #{item.clientPriority}
                    </div>

                    <MediaCard
                      item={item}
                      onDelete={deleteMedia}
                      onEdit={openEdit}
                      selected={selectedSet.has(item._id)}
                      onSelectToggle={toggleSelection}
                    />

                    <button
                      onClick={() => toggleGallery(item._id)}
                      className="mt-2 w-full py-2 rounded-lg text-white text-sm transition-colors bg-red-600 hover:bg-red-700"
                    >
                      Remove From Gallery
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {regularMedia.length > 0 && (
            <section className={`${pinnedMedia.length > 0 ? "border-t border-slate-200 pt-6" : ""} space-y-3`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                  Other Media
                </h2>

                <p className="text-xs sm:text-sm text-slate-500">
                  Ordered by newest date
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {regularMedia.map((item, index) => (
                  <div
                    key={item._id}
                    className="animate-admin-card-in relative flex flex-col"
                    style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
                  >
                    <MediaCard
                      item={item}
                      onDelete={deleteMedia}
                      onEdit={openEdit}
                      selected={selectedSet.has(item._id)}
                      onSelectToggle={toggleSelection}
                    />

                    <button
                      onClick={() => toggleGallery(item._id)}
                      className="mt-2 w-full py-2 rounded-lg text-white text-sm transition-colors bg-green-600 hover:bg-green-700"
                    >
                      Show In Gallery
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

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
                className="px-4 py-2 rounded bg-green-600 text-white"
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
