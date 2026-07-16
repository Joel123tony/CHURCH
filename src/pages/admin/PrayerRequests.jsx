import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import {
  FaCheckCircle,
  FaCheckDouble,
  FaCopy,
  FaEye,
  FaSearch,
  FaShareAlt,
  FaTrashAlt,
  FaWhatsapp,
  FaCheck
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { useConfirm } from "../../context/ConfirmContext";
import "react-toastify/dist/ReactToastify.css";

const SHARE_LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "tamil", label: "Tamil" },
  { value: "both", label: "English + Tamil" },
];

const getShareMode = (languageValue) => {
  if (languageValue === "tamil") return "ta";
  if (languageValue === "both") return "en-ta";
  return "en";
};

export default function PrayerRequests() {
  const confirm = useConfirm();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [language, setLanguage] = useState("english");
  const [shareBusy, setShareBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const fetchRequests = async () => {
    try {
      const res = await API.get("/prayer-requests");
      setRequests(res.data.data || []);
    } catch (err) {
      console.error("Fetch prayer requests error:", err);
      toast.error("Failed to load prayer requests");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const pendingCount = requests.filter((i) => i.status === "pending").length;
  const prayedCount = requests.filter((i) => i.status === "prayed").length;

  const filteredRequests = useMemo(() => {
    const query = search.toLowerCase();

    return requests.filter((item) => {
      const matchStatus = item.status === activeTab;
      const name = (item.name || "").toLowerCase();
      const phone = String(item.phone || "").toLowerCase();
      const request = (item.request || "").toLowerCase();

      const matchSearch =
        name.includes(query) || phone.includes(query) || request.includes(query);

      return matchStatus && matchSearch;
    });
  }, [requests, search, activeTab]);

  const searchSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = requests.filter((item) => item.status === activeTab);

    const matched = query
      ? base.filter((item) => {
          const name = (item.name || "").toLowerCase();
          const phone = String(item.phone || "").toLowerCase();
          const request = (item.request || "").toLowerCase();

          return (
            name.includes(query) ||
            phone.includes(query) ||
            request.includes(query)
          );
        })
      : [...base];

    return matched
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 6);
  }, [requests, activeTab, search]);

  const toggleRequest = (id) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearSelection = async () => {
    if (!selectedRequests.length) return;

    const ok = await confirm({
      title: "Delete Requests",
      message: `Are you sure you want to delete the ${selectedRequests.length} selected prayer requests from the database?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true,
    });
    if (!ok) return;

    API.delete("/prayer-requests/bulk", {
      data: { ids: selectedRequests },
    })
      .then(() => {
        toast.success("Selected prayer requests deleted");
        setSelectedRequests([]);
        fetchRequests();
      })
      .catch((err) => {
        console.error("Delete prayer requests error:", err);
        toast.error(
          err?.response?.data?.message || "Unable to delete selected requests"
        );
      });
  };

  const markPrayed = async (id) => {
    const ok = await confirm({
      title: "Mark as Prayed",
      message: "Are you sure you want to mark this prayer request as prayed?",
      confirmText: "Yes, Mark",
      cancelText: "Cancel",
      isDanger: false,
    });
    if (!ok) return;

    try {
      await API.patch(`/prayer-requests/${id}/prayed`);
      toast.success("Marked as prayed");
      fetchRequests();
      setSelectedRequests((prev) => prev.filter((itemId) => itemId !== id));
    } catch (err) {
      console.error("Mark prayed error:", err);
      toast.error(err?.response?.data?.message || "Unable to update request");
    }
  };

  const bulkMarkPrayed = async () => {
    const pendingIds = selectedItems.filter(i => i.status === "pending").map(i => i._id);
    if (pendingIds.length === 0) {
      toast.info("No pending requests in current selection.");
      return;
    }
    const ok = await confirm({
      title: "Mark as Prayed",
      message: `Are you sure you want to mark ${pendingIds.length} requests as prayed?`,
      confirmText: "Yes, Mark All",
      cancelText: "Cancel",
      isDanger: false,
    });
    if (!ok) return;

    try {
      await Promise.all(pendingIds.map(id => API.patch(`/prayer-requests/${id}/prayed`)));
      toast.success("Requests marked as prayed");
      fetchRequests();
      setSelectedRequests((prev) => prev.filter((id) => !pendingIds.includes(id)));
    } catch (err) {
      console.error("Bulk mark prayed error:", err);
      toast.error("Some requests could not be updated");
      fetchRequests();
    }
  };

  const applySuggestion = (value) => {
    setSearch(value);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const selectedItems = useMemo(
    () => requests.filter((r) => selectedRequests.includes(r._id)),
    [requests, selectedRequests]
  );

  const visibleRequestIds = useMemo(
    () => filteredRequests.map((request) => request._id),
    [filteredRequests]
  );

  const isAllVisibleSelected =
    visibleRequestIds.length > 0 &&
    visibleRequestIds.every((id) => selectedRequests.includes(id));

  const fetchTranslatedPrayerMessage = async () => {
    if (!selectedItems.length) return "";

    try {
      const mode = getShareMode(language);
      const res = await API.post("/prayer/format", {
        requests: selectedItems,
        mode,
      });

      return res?.data?.whatsapp || res?.data?.template || "";
    } catch (err) {
      console.error("Prayer translation error:", err);
      toast.error(
        err?.response?.data?.message || "Unable to translate prayer requests"
      );
      return "";
    }
  };

  const copyPrayerRequests = async () => {
    if (!selectedItems.length) {
      toast.error("Select at least one request");
      return;
    }

    setShareBusy(true);

    try {
      const message = await fetchTranslatedPrayerMessage();
      await navigator.clipboard.writeText(message);
      toast.success("Prayer requests copied");
    } catch (err) {
      console.error(err);
      toast.error("Copy failed");
    } finally {
      setShareBusy(false);
    }
  };

  const sharePrayerRequests = async () => {
    if (!selectedItems.length) {
      toast.error("Select at least one request");
      return;
    }

    setShareBusy(true);

    try {
      const popup = window.open("about:blank", "_blank", "noopener,noreferrer");
      const message = await fetchTranslatedPrayerMessage();
      if (!message) return;
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      if (popup) {
        popup.location.href = url;
        popup.focus();
      } else {
        window.location.assign(url);
      }
    } catch (err) {
      console.error(err);
      toast.error("Share failed");
    } finally {
      setShareBusy(false);
    }
  };

  const toggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedRequests((prev) =>
        prev.filter((id) => !visibleRequestIds.includes(id))
      );
      toast.info("Visible requests unselected");
      return;
    }

    setSelectedRequests((prev) => {
      const next = new Set(prev);
      visibleRequestIds.forEach((id) => next.add(id));
      return Array.from(next);
    });

    toast.success("Visible requests selected");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-[#FCFBF9] font-sans text-slate-800">
      <div className="mx-auto max-w-[1400px] p-3 sm:p-4 lg:p-5">
        
        {/* Header Section */}
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl lg:text-3xl font-bold text-[#531B24] tracking-tight">
              Prayer Requests
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Manage prayer requests, mark responses, and share translated messages with one clean workflow.
            </p>
          </div>

          {/* Statistics */}
          <div className="flex gap-4">
            <div className="relative flex w-36 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-50"></div>
              <span className="relative z-10 text-3xl font-bold text-slate-800">{pendingCount}</span>
              <div className="relative z-10 mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pending</span>
              </div>
            </div>

            <div className="relative flex w-36 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-50"></div>
              <span className="relative z-10 text-3xl font-bold text-slate-800">{prayedCount}</span>
              <div className="relative z-10 mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Prayed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="relative z-20 mb-4 flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          
          {/* Segmented Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 w-full lg:w-auto">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 rounded-lg px-6 py-2 text-sm font-semibold transition-all duration-200 ${
                activeTab === "pending"
                  ? "bg-white text-[#531B24] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab("prayed")}
              className={`flex-1 rounded-lg px-6 py-2 text-sm font-semibold transition-all duration-200 ${
                activeTab === "prayed"
                  ? "bg-white text-[#531B24] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Completed
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
            {/* Search Box */}
            <div className="relative w-full sm:w-[280px]">
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                  setActiveSuggestionIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                onKeyDown={(e) => {
                  if (!showSuggestions || searchSuggestions.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveSuggestionIndex((prev) => prev >= searchSuggestions.length - 1 ? 0 : prev + 1);
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveSuggestionIndex((prev) => prev <= 0 ? searchSuggestions.length - 1 : prev - 1);
                  }
                  if (e.key === "Enter" && activeSuggestionIndex >= 0) {
                    e.preventDefault();
                    const chosen = searchSuggestions[activeSuggestionIndex];
                    if (chosen) applySuggestion(chosen.name || "");
                  }
                  if (e.key === "Escape") setShowSuggestions(false);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-800 transition-all duration-200 focus:border-[#D4AF37] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 placeholder:text-slate-400"
              />
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Suggestions
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {searchSuggestions.map((item, index) => (
                      <button
                        key={item._id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); applySuggestion(item.name || ""); }}
                        className={`flex w-full flex-col gap-1 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-b-0 ${
                          index === activeSuggestionIndex ? "bg-[#D4AF37]/10" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            item.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-500">
                          <span>{item.phone || "No phone"}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="line-clamp-1 flex-1">
                            {item.request}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Select All */}
            {filteredRequests.length > 0 && (
              <button
                onClick={toggleSelectAllVisible}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-[#531B24] focus:outline-none focus:ring-2 focus:ring-[#531B24]/20"
              >
                <FaCheckDouble />
                {isAllVisibleSelected ? "Unselect All" : "Select All"}
              </button>
            )}
          </div>
        </div>

        {/* List of Requests */}
        <div className="flex flex-col gap-4 pb-24">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white/50 py-24 text-center">
              <span className="mb-4 text-6xl opacity-80">🙏</span>
              <h3 className="text-xl font-bold text-slate-800">No Prayer Requests</h3>
              <p className="mt-2 text-sm font-medium text-slate-500">
                New requests will appear here.
              </p>
            </div>
          ) : (
            filteredRequests.map((item, index) => (
              <div
                key={item._id}
                className={`animate-prayer-card-in group relative flex flex-col gap-3 rounded-[18px] border border-slate-100 bg-white p-4 sm:p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] lg:flex-row lg:items-center ${
                  selectedRequests.includes(item._id) ? "ring-2 ring-[#531B24]/50" : ""
                }`}
                style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
              >
                {/* Left side: Checkbox, Name, Date */}
                <div className="flex w-full items-start gap-4 lg:w-[240px] lg:items-center xl:w-[300px]">
                  <div className="pt-1 lg:pt-0">
                    <input
                      type="checkbox"
                      checked={selectedRequests.includes(item._id)}
                      onChange={() => toggleRequest(item._id)}
                      className="h-5 w-5 cursor-pointer rounded border-slate-300 accent-[#531B24] transition-all"
                    />
                  </div>
                  
                  <div className="flex min-w-[150px] flex-col">
                    <h3 className="text-[18px] font-semibold leading-tight text-slate-900">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-[13px] font-medium text-slate-400">
                      {new Date(item.createdAt).toLocaleString("en-US", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "numeric", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>

                {/* Middle: Request Preview */}
                <div className="flex-1 lg:px-4">
                  <p className="line-clamp-2 text-[15px] leading-relaxed text-slate-600">
                    {item.request}
                  </p>
                </div>

                {/* Right side: Status and Buttons */}
                <div className="flex flex-col gap-4 border-t border-slate-50 pt-4 sm:flex-row sm:items-center sm:justify-between lg:w-auto lg:border-t-0 lg:pt-0">
                  <div className="flex w-[90px] justify-start lg:justify-center">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      item.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
                    <button
                      onClick={() => setSelected(item)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 min-h-[42px] text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 sm:flex-none"
                    >
                      <FaEye />
                      <span className="whitespace-nowrap">View Details</span>
                    </button>

                    {item.status === "pending" ? (
                      <button
                        onClick={() => markPrayed(item._id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#531B24] px-4 py-2 min-h-[42px] text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#3f141b] hover:shadow-md sm:flex-none"
                      >
                        <FaCheck />
                        <span className="whitespace-nowrap">Mark Prayed</span>
                      </button>
                    ) : (
                      <div className="flex flex-1 cursor-default items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 min-h-[42px] text-sm font-semibold text-slate-400 sm:flex-none border border-transparent">
                        <FaCheckDouble />
                        <span className="whitespace-nowrap">Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sticky Bulk Action Toolbar */}
      {selectedRequests.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex w-[90%] max-w-[800px] -translate-x-1/2 items-center justify-between rounded-2xl bg-[#531B24] p-4 text-white shadow-[0_10px_40px_-10px_rgba(83,27,36,0.6)] transition-all animate-in slide-in-from-bottom-8 fade-in duration-300">
          <div className="flex items-center gap-3 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold shadow-inner">
              {selectedRequests.length}
            </span>
            <span className="hidden sm:inline">Selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 sm:px-4 text-sm font-semibold transition-colors hover:bg-white/20"
            >
              <FaShareAlt /> <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={bulkMarkPrayed}
              className="flex items-center gap-2 rounded-xl bg-emerald-500/20 px-3 py-2 sm:px-4 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/30"
            >
              <FaCheck /> <span className="hidden sm:inline">Mark as Prayed</span>
            </button>
            <button
              onClick={clearSelection}
              className="flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2 sm:px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-600"
            >
              <FaTrashAlt /> <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* View Request Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="flex max-h-[90vh] flex-col w-full max-w-xl overflow-hidden rounded-[24px] bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Request Details
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Name</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{selected.name}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Phone</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{selected.phone || "N/A"}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 capitalize">{selected.status}</p>
                </div>
                <span className={`inline-flex h-8 items-center rounded-full px-3 text-[11px] font-bold uppercase tracking-wider ${
                  selected.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {selected.status}
                </span>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Prayer Message</p>
                <div className="rounded-2xl border border-slate-100 bg-white p-5 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700 shadow-sm">
                  {selected.request}
                </div>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="mt-8 w-full rounded-xl bg-[#531B24] py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3f141b] focus:outline-none focus:ring-2 focus:ring-[#531B24]/50"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="flex max-h-[90vh] flex-col w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Share Requests</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {selectedRequests.length} request{selectedRequests.length > 1 ? "s" : ""} selected
                </p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Translation Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mb-8 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-medium text-slate-800 transition-all focus:border-[#D4AF37] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
              >
                {SHARE_LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="flex flex-col gap-3">
                <button
                  onClick={sharePrayerRequests}
                  disabled={shareBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1ebd5c] disabled:opacity-70"
                >
                  <FaWhatsapp className="text-lg" />
                  {shareBusy ? "Translating..." : "Share to WhatsApp"}
                </button>

                <button
                  onClick={copyPrayerRequests}
                  disabled={shareBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#531B24] py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3f141b] disabled:opacity-70"
                >
                  <FaCopy className="text-lg" />
                  {shareBusy ? "Translating..." : "Copy to Clipboard"}
                </button>

                <button
                  onClick={() => setShowShareModal(false)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
