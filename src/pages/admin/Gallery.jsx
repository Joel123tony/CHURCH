import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import GalleryUpload from "./GalleryUpload";
import MediaCard from "../../components/MediaCard";
import { toast } from "react-toastify";
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
  const [filterMode, setFilterMode] = useState("all");
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

  /* SEARCH & FILTER */
  const filteredMedia = useMemo(() => {
    let result = media.filter((item) =>
      item.title?.toLowerCase().includes(search.toLowerCase())
    );
    if (filterMode === "photos") {
      result = result.filter((m) => m.mediaType !== "video");
    } else if (filterMode === "videos") {
      result = result.filter((m) => m.mediaType === "video");
    }
    return result;
  }, [media, search, filterMode]);

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

  const groupedRegularMedia = useMemo(() => {
    const groups = {};
    regularMedia.forEach((item) => {
      const value = item.eventDate || item.createdAt;
      const timestamp = value ? new Date(value).getTime() : 0;
      const dateObj = new Date(Number.isFinite(timestamp) ? timestamp : 0);
      const dateStr = dateObj.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[dateStr]) {
        groups[dateStr] = { dateStr, timestamp, items: [] };
      }
      groups[dateStr].items.push(item);
    });
    return Object.values(groups).sort((a, b) => b.timestamp - a.timestamp);
  }, [regularMedia]);

  const galleryCount = useMemo(
    () => media.filter((item) => item.clientPriority !== null).length,
    [media]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#F8F6F4] min-h-screen w-full font-sans">
      <div className="max-w-[1200px] mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#531B24] flex items-center gap-2 tracking-tight">
              Gallery Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage and optimize gallery images and videos.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#531B24]/5 px-3 py-1.5 text-xs font-bold text-[#531B24] border border-[#531B24]/10 shadow-sm w-fit">
            <span className="w-2 h-2 rounded-full bg-[#531B24] animate-pulse" />
            Homepage Gallery: {galleryCount}/4
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-1 mb-6 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-max">
          <button
            onClick={() => setActiveTab("add")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "add" 
                ? "bg-[#531B24] text-white shadow-md" 
                : "text-slate-600 hover:bg-slate-50 hover:text-[#531B24]"
            }`}
          >
            <FaPlus size={12} /> Add Media
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "list" 
                ? "bg-[#531B24] text-white shadow-md" 
                : "text-slate-600 hover:bg-slate-50 hover:text-[#531B24]"
            }`}
          >
            <FaList size={12} /> Gallery List
          </button>
        </div>

        <div className="relative w-full">
        {/* ADD TAB */}
        {activeTab === "add" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">
                  Upload Media
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Add images or videos to the gallery.</p>
              </div>
              <div className="p-5">
                <GalleryUpload onSuccess={handleUploadSuccess} />
              </div>
            </div>
          </div>
        )}

        {/* LIST TAB */}
        {activeTab === "list" && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-4">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-300 border-t-[#531B24] rounded-full animate-spin"></span>
                  Loading gallery...
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  {/* SEARCH & FILTERS */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                    <div className="relative w-full sm:max-w-sm">
                      <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search gallery by title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                      {["all", "photos", "videos"].map(mode => (
                        <button
                          key={mode}
                          onClick={() => setFilterMode(mode)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap border shadow-sm ${
                            filterMode === mode 
                              ? "bg-[#531B24] border-[#531B24] text-white" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* BULK ACTIONS */}
                  {filteredMedia.length > 0 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/80 px-4 py-3 rounded-lg border border-slate-200 mb-6">
                      <div className="text-xs font-semibold text-slate-600">
                        {selectedCount > 0 ? (
                          <span className="text-[#531B24]">
                            {selectedCount} selected
                            {visibleSelectedCount > 0 ? ` (${visibleSelectedCount} visible)` : ""}
                          </span>
                        ) : (
                          "Select items for bulk actions"
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={toggleSelectAllVisible}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          {allVisibleSelected ? "Unselect All" : "Select All"}
                        </button>
                        <button
                          type="button"
                          onClick={clearSelection}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={bulkDeleteMedia}
                          disabled={!selectedCount}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
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

                      {groupedRegularMedia.length > 0 && (
                        <section className={`${pinnedMedia.length > 0 ? "border-t border-slate-100 pt-8" : ""}`}>
                          <div className="flex items-center justify-between gap-3 mb-6">
                            <h2 className="text-lg font-bold text-slate-800">
                              Other Media
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Newest First
                            </p>
                          </div>

                          <div className="space-y-8">
                            {groupedRegularMedia.map((group) => (
                              <div key={group.dateStr}>
                                <h3 className="text-sm font-bold text-slate-700 mb-3 tracking-tight">
                                  {group.dateStr}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
                                  {group.items.map((item, index) => (
                                    <div
                                      key={item._id}
                                      className="animate-admin-card-in relative flex flex-col group"
                                      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">Edit Media Details</h2>
            </div>
            
            <div className="px-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Media Title"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-white"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button
                onClick={() => setEditItem(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#531B24] rounded-md hover:bg-[#40151c] transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
