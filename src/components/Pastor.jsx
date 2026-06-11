import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Pastor() {
  const [pastors, setPastors] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchYear, setSearchYear] = useState("");
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const getImage = (pastor) => {
    return pastor?.image?.url || "/placeholder.png";
  };

  useEffect(() => {
    const fetchPastors = async () => {
      try {
        const res = await API.get("/pastors");

        let data = [];

        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (Array.isArray(res.data?.data)) {
          data = res.data.data;
        } else if (Array.isArray(res.data?.pastors)) {
          data = res.data.pastors;
        }

        setPastors(data);
      } catch (error) {
        console.error("Pastor fetch error:", error);
        setPastors([]);
      }
    };

    fetchPastors();
  }, []);

  const currentPastor =
    pastors.find((p) => p?.isCurrent === true) || null;

  const searchPastors = () => {
    const filtered = pastors.filter((p) => {
      const nameMatch =
        searchName.trim() === ""
          ? true
          : p?.name
              ?.toLowerCase()
              .includes(searchName.toLowerCase());

      const yearText = `${p?.joinedYear || ""} ${p?.leftYear || ""}`;

      const yearMatch =
        searchYear.trim() === ""
          ? true
          : yearText.includes(searchYear);

      return nameMatch && yearMatch;
    });

    setResults(filtered);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setResults([]);
  };

  return (
    <>
      <section className="bg-[#5b1320] py-16 px-6">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-white text-3xl font-bold mb-8">
            Pastor
          </h2>

          <div className="grid lg:grid-cols-4 gap-6">

            {/* CURRENT PASTOR */}
            <div className="lg:col-span-3 bg-[#d8cbb7] rounded-3xl p-8">

              {currentPastor ? (
                <div className="grid md:grid-cols-2 gap-8 items-center">

                  <div>
                    <h3 className="text-xl font-bold text-[#5b1320] mb-6">
                      Current Pastor
                    </h3>

                    <div className="space-y-4 text-[#5b1320]">

                      <p>
                        <strong>Pastor Name:</strong>{" "}
                        {currentPastor.name}
                      </p>

                      <p>
                        <strong>Role:</strong>{" "}
                        {currentPastor.role}
                      </p>

                      <p>
                        <strong>Joined Year:</strong>{" "}
                        {currentPastor.joinedYear}
                      </p>

                      <p>
                        <strong>Serving Until:</strong>{" "}
                        {currentPastor.leftYear || "Present"}
                      </p>

                      <p>
                        <strong>Bio:</strong>{" "}
                        {currentPastor.bio || "No details available"}
                      </p>

                    </div>
                  </div>

                  <div className="flex justify-center">
                    <img
                      src={getImage(currentPastor)}
                      alt={currentPastor.name}
                      className="w-64 h-64 object-cover rounded-3xl shadow-lg"
                    />
                  </div>

                </div>
              ) : (
                <div className="text-center py-10">
                  <h3 className="text-2xl font-bold text-[#5b1320]">
                    No Current Pastor Selected
                  </h3>
                </div>
              )}

            </div>

            {/* SEARCH */}
            <div className="bg-[#d8cbb7] rounded-3xl p-6">

              <h3 className="text-center font-bold text-[#5b1320] mb-4">
                Search Pastors
              </h3>

              <input
                type="text"
                placeholder="Search By Name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full mb-4 p-3 rounded-full bg-white outline-none"
              />

              <input
                type="text"
                placeholder="Search By Year"
                value={searchYear}
                onChange={(e) => setSearchYear(e.target.value)}
                className="w-full mb-4 p-3 rounded-full bg-white outline-none"
              />

              <button
                onClick={searchPastors}
                className="w-full bg-[#5b1320] text-white py-3 rounded-full font-semibold"
              >
                Search
              </button>

            </div>

          </div>
        </div>
      </section>

      {/* SEARCH MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">

          <div className="bg-[#d8cbb7] rounded-3xl p-8 w-full max-w-4xl relative max-h-[80vh] overflow-y-auto">

            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full"
            >
              Close
            </button>

            <h2 className="text-2xl font-bold text-[#5b1320] mb-6">
              Search Results
            </h2>

            {results.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-3xl font-bold text-red-600">
                  No Pastor Found
                </h3>
              </div>
            ) : (
              results.map((p) => (
                <div
                  key={p._id}
                  className="border-b border-[#5b1320]/20 pb-6 mb-6"
                >
                  <div className="flex flex-col md:flex-row gap-6">

                    <img
                      src={getImage(p)}
                      alt={p.name}
                      className="w-40 h-40 rounded-2xl object-cover"
                    />

                    <div>

                      <h3 className="text-xl font-bold text-[#5b1320]">
                        {p.name}
                      </h3>

                      {p.isCurrent && (
                        <span className="inline-block mt-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs">
                          Current Pastor
                        </span>
                      )}

                      <p className="mt-3 text-[#5b1320]">
                        {p.joinedYear} - {p.leftYear || "Present"}
                      </p>

                      <p className="mt-3 text-[#5b1320]">
                        {p.bio || "No details available"}
                      </p>

                    </div>

                  </div>
                </div>
              ))
            )}

          </div>

        </div>
      )}
    </>
  );
}