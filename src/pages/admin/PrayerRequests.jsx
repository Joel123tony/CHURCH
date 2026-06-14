import { useEffect, useState } from "react";
import API from "../../api/axios";

export default function PrayerRequests() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] =
    useState("pending");

  const fetchRequests = async () => {
    try {
      const res = await API.get(
        "/prayer-requests"
      );

      setRequests(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const markPrayed = async (id) => {
    try {
      await API.patch(
        `/prayer-requests/${id}/prayed`
      );

      fetchRequests();
    } catch (err) {
      console.log(err);
    }
  };

  const filteredRequests =
    requests.filter((item) => {
      const matchStatus =
        item.status === activeTab;

      const matchSearch =
        item.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        (item.phone || "").includes(
          search
        ) ||
        item.request
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      return (
        matchStatus &&
        matchSearch
      );
    });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Prayer Requests
      </h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search prayer requests..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        className="w-full mb-5 border rounded-xl p-3"
      />

      {/* TABS */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() =>
            setActiveTab("pending")
          }
          className={`px-5 py-2 rounded-xl font-medium ${
            activeTab === "pending"
              ? "bg-primary text-white"
              : "bg-white border"
          }`}
        >
          Pending (
          {
            requests.filter(
              (i) =>
                i.status === "pending"
            ).length
          }
          )
        </button>

        <button
          onClick={() =>
            setActiveTab("prayed")
          }
          className={`px-5 py-2 rounded-xl font-medium ${
            activeTab === "prayed"
              ? "bg-primary text-white"
              : "bg-white border"
          }`}
        >
          Completed (
          {
            requests.filter(
              (i) =>
                i.status === "prayed"
            ).length
          }
          )
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {filteredRequests.length ===
        0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-gray-500">
            No Prayer Requests Found
          </div>
        ) : (
          filteredRequests.map(
            (item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl p-5 shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">
                      {item.name}
                    </h3>

                    <p className="text-gray-500 text-sm">
                      {new Date(
                        item.createdAt
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status ===
                      "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() =>
                      setSelected(item)
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                  >
                    View
                  </button>

                  {item.status ===
                    "pending" && (
                    <button
                      onClick={() =>
                        markPrayed(
                          item._id
                        )
                      }
                      className="bg-green-600 text-white px-4 py-2 rounded-xl"
                    >
                      Prayed
                    </button>
                  )}
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full">
            <h2 className="text-2xl font-bold mb-4">
              Prayer Request
            </h2>

            <p className="mb-2">
              <strong>Name:</strong>{" "}
              {selected.name}
            </p>

            <p className="mb-2">
              <strong>Phone:</strong>{" "}
              {selected.phone ||
                "N/A"}
            </p>

            <p className="mb-2">
              <strong>Status:</strong>{" "}
              {selected.status}
            </p>

            <div className="mt-4 p-4 bg-gray-50 rounded-xl whitespace-pre-wrap">
              {selected.request}
            </div>

            <button
              onClick={() =>
                setSelected(null)
              }
              className="mt-6 bg-primary text-white px-6 py-2 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}