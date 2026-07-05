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
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#54091b] flex items-center gap-3 tracking-tight">
            <FaImage className="text-[#ee0039]" />
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
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeTab === "add" 
              ? "bg-[#ee0039] text-white shadow-md" 
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <FaPlus /> Add Media
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeTab === "list" 
              ? "bg-[#54091b] text-white shadow-md" 
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <FaList /> Gallery List
        </button>
      </div>

      <div className="relative w-full">
        {/* ADD TAB */}
        {activeTab === "add" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FaUpload className="text-[#ee0039]" /> Upload Media
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
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  {/* SEARCH & FILTERS */}
                  <div className="relative mb-6">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search gallery by title..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl p-3.5 pl-11 focus:outline-none focus:ring-4 focus:ring-[#ee0039]/20 focus:border-[#ee0039] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium"
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
                          className="rounded-xl bg-white border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                        >
                          {allVisibleSelected ? "Unselect All" : "Select All"}
                        </button>
                        <button
                          type="button"
                          onClick={clearSelection}
                          className="rounded-xl bg-white border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={bulkDeleteMedia}
                          disabled={!selectedCount}
                          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-600/20"
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
                                />

                                <button
                                  onClick={() => toggleGallery(item._id)}
                                  className="mt-3 w-full py-2.5 rounded-xl font-bold text-[#ee0039] bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-100"
                                >
                                  Remove From Gallery
                                </button>
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
                                />

                                <button
                                  onClick={() => toggleGallery(item._id)}
                                  className="mt-3 w-full py-2.5 rounded-xl font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-100"
                                >
                                  Pin to Homepage
                                </button>
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-[#54091b] border-b border-slate-100 pb-4">Edit Media Details</h2>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Media Title"
                className="w-full border-2 border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-4 focus:ring-[#ee0039]/20 focus:border-[#ee0039] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Event Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-4 focus:ring-[#ee0039]/20 focus:border-[#ee0039] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditItem(null)}
                className="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-6 py-3 rounded-xl bg-[#54091b] text-white font-bold hover:bg-[#3d0613] transition-colors shadow-md shadow-[#54091b]/20"
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
