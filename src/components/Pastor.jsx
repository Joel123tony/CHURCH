import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Pastor() {
  const [pastors, setPastors] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchYear, setSearchYear] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ---------------- SAFE EXTRACT ----------------
  const extractArray = (res) => {
    const data = res?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.pastors)) return data.pastors;
    return [];
  };

  // ---------------- IMAGE ----------------
  const getImage = (p) =>
    p?.image?.url || "/placeholder.png";

  // ---------------- FETCH ----------------
  useEffect(() => {
    API.get("/pastors")
      .then((res) => {
        const list = extractArray(res);

        // ONLY ACTIVE PASTORS FOR CURRENT VIEW
        const active = list.filter((p) => p?.isActive !== false);

        setPastors(active);
      })
      .catch((err) => {
        console.error(err);
        setPastors([]);
      });
  }, []);

  // ---------------- CURRENT PASTOR ----------------
  const currentPastor =
    pastors.find((p) => p?.isActive === true) || pastors[0];

  // ---------------- SEARCH (FIXED FRONTEND LOGIC) ----------------
  const searchPastors = () => {
    const filtered = (pastors || []).filter((p) => {
      const name = p?.name || "";
      const year = String(p?.joinedYear || "") + String(p?.endYear || "");

      const matchName =
        searchName.trim() === ""
          ? true
          : name.toLowerCase().includes(searchName.toLowerCase());

      const matchYear =
        searchYear.trim() === ""
          ? true
          : year.includes(searchYear);

      return matchName && matchYear;
    });

    setResults(filtered);
    setSearched(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setResults([]);
  };

  // ---------------- UI ----------------
  return (
    <>
      <section className="bg-[#5b1320] py-16 px-6">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-white text-3xl font-bold mb-8">
            Pastor
          </h2>

          <div className="grid lg:grid-cols-4 gap-6">

            {/* ================= CURRENT PASTOR ================= */}
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
                        <strong>Joined Year:</strong>{" "}
                        {currentPastor.joinedYear}
                      </p>

                      <p>
                        <strong>Bio:</strong>{" "}
                        {currentPastor.bio}
                      </p>

                      <p>
                        <strong>End Year:</strong>{" "}
                        {currentPastor.endYear || "Present"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <img
                      src={getImage(currentPastor)}
                      alt={currentPastor.name}
                      className="w-48 h-48 object-cover rounded-3xl"
                    />
                  </div>

                </div>
              ) : (
                <p className="text-[#5b1320]">No pastor data found.</p>
              )}
            </div>

            {/* ================= SEARCH ================= */}
            <div className="bg-[#d8cbb7] rounded-3xl p-6">

              <h3 className="text-center font-bold text-[#5b1320] mb-4">
                Past Worked Pastors
              </h3>

              <input
                placeholder="Search By Name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full mb-4 p-3 rounded-full bg-gray-100 outline-none"
              />

              <input
                placeholder="Search By Year"
                value={searchYear}
                onChange={(e) => setSearchYear(e.target.value)}
                className="w-full mb-4 p-3 rounded-full bg-gray-100 outline-none"
              />

              <button
                onClick={searchPastors}
                className="w-full bg-white text-[#5b1320] font-semibold py-2 rounded-full"
              >
                Search
              </button>

              <div className="mt-6 text-center text-sm text-[#5b1320]">
                {!searched && "Search by name or year"}
                {searched && results.length === 0 && "No pastors found"}
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">

          <div className="bg-[#d8cbb7] rounded-3xl p-8 w-full max-w-4xl relative max-h-[80vh] overflow-auto">

            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full"
            >
              Close ✖
            </button>

            <h2 className="text-2xl font-bold text-[#5b1320] mb-6">
              Search Results
            </h2>

            {results.map((p) => (
              <div
                key={p._id}
                className="mb-6 border-b border-[#5b1320]/20 pb-4"
              >
                <h3 className="text-xl font-bold text-[#5b1320]">
                  {p.name}
                </h3>

                <p className="text-[#5b1320]">
                  {p.joinedYear} - {p.endYear || "Present"}
                </p>

                <p className="text-[#5b1320] mt-2">
                  {p.bio}
                </p>

                <img
                  src={getImage(p)}
                  alt={p.name}
                  className="w-40 h-40 object-cover rounded-xl mt-3"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}