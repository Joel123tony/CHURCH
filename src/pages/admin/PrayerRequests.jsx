import { useEffect, useState } from "react";
import API from "../../api/axios";
import { FaWhatsapp, FaCopy } from "react-icons/fa";

const SHARE_TEMPLATES = {
  english: {
    title: "METHODIST TAMIL CHURCH",
    heading: "PRAYER REQUESTS",
    intro: "Please uphold the following requests in prayer.",
    itemLabel: "Request",
    separator: "\n\n━━━━━━━━━━━━━━\n\n",
  },
  tamil: {
    title: "மெதடிஸ்ட் தமிழ் திருச்சபை",
    heading: "ஜெப விண்ணப்பங்கள்",
    intro: "பின்வரும் விண்ணப்பங்களுக்காக ஜெபிக்கவும்.",
    itemLabel: "விண்ணப்பம்",
    separator: "\n\n━━━━━━━━━━━━━━\n\n",
  },
};

const SHARE_LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "tamil", label: "Tamil" },
  { value: "both", label: "English + Tamil" },
];

export default function PrayerRequests() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [language, setLanguage] = useState("english");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const fetchRequests = async () => {
    try {
      const res = await API.get("/prayer-requests");
      setRequests(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const markPrayed = async (id) => {
    try {
      await API.patch(`/prayer-requests/${id}/prayed`);
      fetchRequests();
    } catch (err) {
      console.log(err);
    }
  };

  const toggleRequest = (id) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredRequests = requests.filter((item) => {
    const matchStatus = item.status === activeTab;

    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.phone || "").includes(search) ||
      item.request.toLowerCase().includes(search.toLowerCase());

    return matchStatus && matchSearch;
  });

  const selectAllRequests = () => {
    const ids = filteredRequests.map((r) => r._id);
    setSelectedRequests(ids);
  };

  const clearSelection = () => {
    setSelectedRequests([]);
  };

  const buildPrayerMessageByLanguage = (targetLanguage) => {
    const template = SHARE_TEMPLATES[targetLanguage];

    if (!template) return "";

    const selectedItems = requests.filter((r) => selectedRequests.includes(r._id));
    if (!selectedItems.length) return "";

    const body = selectedItems
      .map(
        (item, index) =>
          `${index + 1}. ${item.name}\n${template.itemLabel}: ${item.request}`
      )
      .join(template.separator);

    return `*${template.title}*\n*${template.heading}*\n\n${template.intro}\n\n${body}`;
  };

  const buildPrayerMessage = () => {
    if (language === "both") {
      const englishMessage = buildPrayerMessageByLanguage("english");
      const tamilMessage = buildPrayerMessageByLanguage("tamil");

      if (!englishMessage && !tamilMessage) return "";
      if (!englishMessage) return tamilMessage;
      if (!tamilMessage) return englishMessage;

      return `${englishMessage}\n\n\n${tamilMessage}`;
    }

    return buildPrayerMessageByLanguage(language);
  };

  const copyPrayerRequests = async () => {
    try {
      const message = buildPrayerMessage();
      await navigator.clipboard.writeText(message);
      alert("Prayer requests copied successfully");
    } catch (err) {
      console.log(err);
    }
  };

  const sharePrayerRequests = () => {
    const message = buildPrayerMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Prayer Requests</h1>

      <input
        type="text"
        placeholder="Search prayer requests..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-5 border rounded-xl p-3"
      />

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-5 py-2 rounded-xl font-medium ${
            activeTab === "pending" ? "bg-primary text-white" : "bg-white border"
          }`}
        >
          Pending ({requests.filter((i) => i.status === "pending").length})
        </button>

        <button
          onClick={() => setActiveTab("prayed")}
          className={`px-5 py-2 rounded-xl font-medium ${
            activeTab === "prayed" ? "bg-primary text-white" : "bg-white border"
          }`}
        >
          Completed ({requests.filter((i) => i.status === "prayed").length})
        </button>
      </div>

      {filteredRequests.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-5">
          <button
            onClick={selectAllRequests}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            Select All
          </button>

          <button
            onClick={clearSelection}
            className="bg-gray-500 text-white px-4 py-2 rounded-xl"
          >
            Clear
          </button>

          {selectedRequests.length > 0 && (
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-green-600 text-white px-5 py-2 rounded-xl"
            >
              Share Requests ({selectedRequests.length})
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-gray-500">
            No Prayer Requests Found
          </div>
        ) : (
          filteredRequests.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl p-5 shadow">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedRequests.includes(item._id)}
                  onChange={() => toggleRequest(item._id)}
                  className="w-5 h-5 mt-1"
                />

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{item.name}</h3>

                      <p className="text-gray-500 text-sm">
                        {new Date(item.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setSelected(item)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                    >
                      View
                    </button>

                    {item.status === "pending" && (
                      <button
                        onClick={() => markPrayed(item._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl"
                      >
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full">
            <h2 className="text-2xl font-bold mb-4">Prayer Request</h2>

            <p className="mb-2">
              <strong>Name:</strong> {selected.name}
            </p>

            <p className="mb-2">
              <strong>Phone:</strong> {selected.phone || "N/A"}
            </p>

            <p className="mb-2">
              <strong>Status:</strong> {selected.status}
            </p>

            <div className="mt-4 p-4 bg-gray-50 rounded-xl whitespace-pre-wrap">
              {selected.request}
            </div>

            <button
              onClick={() => setSelected(null)}
              className="mt-6 bg-primary text-white px-6 py-2 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-5">Share Prayer Requests</h2>

            <label className="block mb-2 font-medium">Language</label>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border rounded-xl p-3 mb-5"
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
                className="bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <FaWhatsapp />
                WhatsApp Share
              </button>

              <button
                onClick={copyPrayerRequests}
                className="bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <FaCopy />
                Copy Request
              </button>

              <button
                onClick={() => setShowShareModal(false)}
                className="bg-gray-500 text-white py-3 rounded-xl font-semibold"
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
