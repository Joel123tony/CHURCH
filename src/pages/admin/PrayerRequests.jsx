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
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen w-full">
      <div className="admin-header-container mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between w-full">
          <div className="max-w-2xl">
            <h1 className="admin-header-title">
              Prayer Requests
            </h1>
            <p className="admin-header-desc">
              Manage prayer requests, mark responses, and share translated
              messages with one clean workflow.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <span className="rounded-full bg-amber-100 px-3 py-1.5 font-semibold text-amber-800">
              Pending {pendingCount}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-800">
              Prayed {prayedCount}
            </span>
          </div>
        </div>

        <div className="relative mt-5">
          <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search prayer requests..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
              setActiveSuggestionIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 120);
            }}
            onKeyDown={(e) => {
              if (!showSuggestions || searchSuggestions.length === 0) return;

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveSuggestionIndex((prev) =>
                  prev >= searchSuggestions.length - 1 ? 0 : prev + 1
                );
              }

              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSuggestionIndex((prev) =>
                  prev <= 0 ? searchSuggestions.length - 1 : prev - 1
                );
              }

              if (e.key === "Enter" && activeSuggestionIndex >= 0) {
                e.preventDefault();
                const chosen = searchSuggestions[activeSuggestionIndex];
                if (chosen) applySuggestion(chosen.name || "");
              }

              if (e.key === "Escape") {
                setShowSuggestions(false);
              }
            }}
            className="admin-input pl-11 !bg-white focus:!bg-white"
          />

          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Smart Suggestions
              </div>

              <div className="max-h-72 overflow-y-auto">
                {searchSuggestions.map((item, index) => (
                  <button
                    key={item._id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applySuggestion(item.name || "");
                    }}
                    className={`flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors last:border-b-0 ${
                      index === activeSuggestionIndex
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-800">
                        {item.name}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          item.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{item.phone || "No phone"}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="line-clamp-1">
                        {(item.request || "").slice(0, 70)}
                        {(item.request || "").length > 70 ? "..." : ""}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm w-max border border-slate-100">
            <button
              onClick={() => setActiveTab("pending")}
              className={activeTab === "pending" ? "admin-tab-active" : "admin-tab-inactive"}
            >
              Pending ({pendingCount})
            </button>

            <button
              onClick={() => setActiveTab("prayed")}
              className={activeTab === "prayed" ? "admin-tab-active" : "admin-tab-inactive"}
            >
              Completed ({prayedCount})
            </button>
          </div>

          {filteredRequests.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleSelectAllVisible}
                className="admin-btn-secondary"
              >
                <FaCheckDouble />
                {isAllVisibleSelected ? "Unselect All" : "Select All"}
              </button>

              <button
                onClick={clearSelection}
                className="admin-btn-red"
              >
                <FaTrashAlt />
                Clear
              </button>

              {selectedRequests.length > 0 && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="admin-btn-green"
                >
                  <FaShareAlt />
                  Share Requests ({selectedRequests.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-gray-500 shadow-sm">
            No Prayer Requests Found
          </div>
        ) : (
          filteredRequests.map((item, index) => (
            <div
              key={item._id}
              className="animate-prayer-card-in admin-card p-4 sm:p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              style={{
                animationDelay: `${Math.min(index, 12) * 90}ms`,
              }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <input
                  type="checkbox"
                  checked={selectedRequests.includes(item._id)}
                  onChange={() => toggleRequest(item._id)}
                  className="mt-1 h-5 w-5 flex-shrink-0 accent-[#531B24] cursor-pointer"
                />

                <div className="flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-900">
                        {item.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {new Date(item.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => setSelected(item)}
                      className="admin-btn-blue flex-1 !py-2.5 !text-xs sm:text-sm"
                    >
                      <FaEye />
                      View
                    </button>

                    {item.status === "pending" && (
                      <button
                        onClick={() => markPrayed(item._id)}
                        className="admin-btn-green"
                      >
                        <FaCheckCircle />
                        Prayed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="admin-card w-full max-w-xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-bold text-[#531B24]">
                Prayer Request
              </h2>

              <button
                onClick={() => setSelected(null)}
                className="admin-btn-icon bg-slate-100 text-slate-700 hover:bg-slate-200"
                aria-label="Close request dialog"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Name
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {selected.name}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Phone
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {selected.phone || "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Status
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {selected.status}
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-[#f8fafc] p-4 whitespace-pre-wrap text-slate-700">
              {selected.request}
            </div>

            <button
              onClick={() => setSelected(null)}
              className="admin-btn-primary mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="admin-card w-full max-w-md p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[#531B24]">
                  Share Prayer Requests
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedRequests.length} selected
                </p>
              </div>

              <button
                onClick={() => setShowShareModal(false)}
                className="admin-btn-icon bg-slate-100 text-slate-700 hover:bg-slate-200"
                aria-label="Close share dialog"
              >
                ×
              </button>
            </div>

            <label className="mb-2 mt-5 block font-medium text-slate-700">
              Language
            </label>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="admin-input mb-5"
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
                className="admin-btn-green w-full"
              >
                <FaWhatsapp />
                {shareBusy ? "Translating..." : "WhatsApp Share"}
              </button>

              <button
                onClick={copyPrayerRequests}
                disabled={shareBusy}
                className="admin-btn-primary w-full"
              >
                <FaCopy />
                {shareBusy ? "Translating..." : "Copy Request"}
              </button>

              <button
                onClick={() => setShowShareModal(false)}
                className="admin-btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
