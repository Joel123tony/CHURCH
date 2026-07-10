import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import GalleryUpload from "./GalleryUpload";
import MediaCard from "../../components/MediaCard";
import { ToastContainer, toast } from "react-toastify";
import { useConfirm } from "../../context/ConfirmContext";
import "react-toastify/dist/ReactToastify.css";
import {
  FaImage,
  FaPlus,
  FaList,
  FaUpload,
  FaSearch
} from "react-icons/fa";

export default function Gallery() {
  const confirm = useConfirm();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tabs State
  const [activeTab, setActiveTab] = useState("add"); // "add" | "list"

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
    setActiveTab("list");
  }, []);

  /* DELETE */
  const deleteMedia = useCallback(async (id) => {
    const ok = await confirm({
      title: "Delete Media",
      message: "Are you sure you want to delete this media item?",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true,
    });
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
  }, [confirm]);

  const bulkDeleteMedia = useCallback(async () => {
    if (!selectedItems.length) {
      toast.info("Select at least one media item");
      return;
    }

    const ok = await confirm({
      title: "Bulk Delete Media",
      message: `Are you sure you want to delete ${selectedItems.length} selected media item(s)?`,
      confirmText: "Delete All",
      cancelText: "Cancel",
      isDanger: true,
    });

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
  }, [selectedItems, confirm]);

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
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen w-full">
      {/* HEADER SECTION - strictly functional */}
      <div className="admin-header-container">
        <div>
          <h1 className="admin-header-title">
            <FaImage className="admin-header-icon" />
            Gallery Management
          </h1>
        </div>
        <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800 border border-emerald-200">
          Homepage Gallery: {galleryCount}/4
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm w-max border border-slate-100">
        <button
          onClick={() => setActiveTab("add")}
          className={activeTab === "add" ? "admin-tab-active" : "admin-tab-inactive"}
        >
          <FaPlus /> Add Media
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={activeTab === "list" ? "admin-tab-active" : "admin-tab-inactive"}
        >
          <FaList /> Gallery List
        </button>
      </div>

      <div className="relative w-full">
        {/* ADD TAB */}
        {activeTab === "add" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="admin-card p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-[#531B24] flex items-center gap-2">
                  <FaUpload className="text-[#531B24]" /> Upload Media
                </h2>
              </div>
              <GalleryUpload onSuccess={handleUploadSuccess} />
            </div>
          </div>
        )}

        {/* LIST TAB */}
        {activeTab === "list" && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-slate-500 font-medium">Loading gallery...</p>
              </div>
            ) : (
              <>
                <div className="admin-card p-6">
                  {/* SEARCH & FILTERS */}
                  <div className="relative mb-6">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search gallery by title..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="admin-input pl-11 !bg-white focus:!bg-white"
                    />
                  </div>

                  {/* BULK ACTIONS */}
                  {filteredMedia.length > 0 && (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                      <div className="text-sm font-bold text-slate-600">
                        {selectedCount > 0 ? (
                          <span className="text-[#ee0039]">
                            {selectedCount} selected
                            {visibleSelectedCount > 0 ? ` (${visibleSelectedCount} visible)` : ""}
                          </span>
                        ) : (
                          "Select items to perform bulk actions"
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={toggleSelectAllVisible}
                          className="admin-btn-secondary !py-2"
                        >
                          {allVisibleSelected ? "Unselect All" : "Select All"}
                        </button>
                        <button
                          type="button"
                          onClick={clearSelection}
                          className="admin-btn-secondary !py-2"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={bulkDeleteMedia}
                          disabled={!selectedCount}
                          className="admin-btn-red !py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  )}

                  {/* EMPTY STATE */}
                  {filteredMedia.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 font-medium">
                      No media found. Try a different search or upload new items.
                    </div>
                  )}

                  {/* GRID */}
                  {filteredMedia.length > 0 && (
                    <div className="space-y-8">
                      {pinnedMedia.length > 0 && (
                        <section>
                          <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-lg font-bold text-slate-800">
                              Homepage Gallery
                            </h2>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                              {pinnedMedia.length} pinned
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {pinnedMedia.map((item, index) => (
                              <div
                                key={item._id}
                                className="animate-admin-card-in relative flex flex-col group"
                                style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
                              >
                                <div className="absolute z-20 top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                                  Position #{item.clientPriority}
                                </div>

                                <MediaCard
                                  item={item}
                                  onDelete={deleteMedia}
                                  onEdit={openEdit}
                                  selected={selectedSet.has(item._id)}
                                  onSelectToggle={toggleSelection}
                                  isPinned={true}
                                  onTogglePin={toggleGallery}
                                />
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {regularMedia.length > 0 && (
                        <section className={`${pinnedMedia.length > 0 ? "border-t border-slate-100 pt-8" : ""}`}>
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <h2 className="text-lg font-bold text-slate-800">
                              Other Media
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Newest First
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {regularMedia.map((item, index) => (
                              <div
                                key={item._id}
                                className="animate-admin-card-in relative flex flex-col group"
                                style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
                              >
                                <MediaCard
                                  item={item}
                                  onDelete={deleteMedia}
                                  onEdit={openEdit}
                                  selected={selectedSet.has(item._id)}
                                  onSelectToggle={toggleSelection}
                                  isPinned={false}
                                  onTogglePin={toggleGallery}
                                />
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="admin-card w-full max-w-md p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-[#531B24] border-b border-slate-100 pb-4">Edit Media Details</h2>

            <div>
              <label className="admin-label">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Media Title"
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label">Event Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="admin-input"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditItem(null)}
                className="admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="admin-btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
