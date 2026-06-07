import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Pastor() {
  const [pastors, setPastors] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchYear, setSearchYear] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const [selectedPastor, setSelectedPastor] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ---------------- LOAD ALL PASTORS ----------------
  useEffect(() => {
    API.get("/pastors")
      .then((res) => {
        setPastors(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const currentPastor =
    pastors.find((p) => p.isCurrent) || pastors[0];

  // ---------------- SEARCH ----------------
  const searchPastors = async () => {
    try {
      const res = await API.get(
        `/pastors/search?name=${searchName}&year=${searchYear}`
      );

      const filtered = res.data.filter((p) => !p.isCurrent);

      setResults(filtered);
      setSearched(true);

      if (filtered.length > 0) {
        setSelectedPastor(filtered[0]);
        setShowModal(true);
      }
    } catch (err) {
      console.error(err);
    }
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
                        <strong>Pastor Name :</strong>{" "}
                        {currentPastor.name}
                      </p>

                      <p>
                        <strong>Join Date :</strong>{" "}
                        {currentPastor.joinedYear}
                      </p>

                      <p>
                        <strong>Details :</strong>{" "}
                        {currentPastor.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    {currentPastor.photo || currentPastor.image?.url ? (
                      <img
                        src={currentPastor.photo || currentPastor.image?.url}
                        alt={currentPastor.name}
                        className="w-48 h-48 object-cover rounded-3xl"
                      />
                    ) : (
                      <div className="w-48 h-48 rounded-3xl bg-gray-200" />
                    )}
                  </div>

                </div>
              ) : (
                <p className="text-[#5b1320]">
                  No pastor data found.
                </p>
              )}

            </div>

            {/* SEARCH PANEL */}
            <div className="bg-[#d8cbb7] rounded-3xl p-6">

              <h3 className="text-center font-bold text-[#5b1320] mb-4">
                Past Worked Pastors
              </h3>

              <input
                type="text"
                placeholder="Search By Name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full mb-4 p-3 rounded-full bg-gray-100 outline-none"
              />

              <input
                type="text"
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

              <div className="mt-6">
                {!searched && (
                  <p className="text-center text-[#5b1320] text-sm">
                    Search by pastor name or year
                  </p>
                )}

                {searched && results.length === 0 && (
                  <p className="text-center text-[#5b1320] text-sm">
                    No pastors found
                  </p>
                )}
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* MODAL */}
      {showModal && selectedPastor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">

          <div className="bg-[#d8cbb7] rounded-3xl p-8 w-full max-w-4xl relative">

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full"
            >
              Close
            </button>

            <div className="grid md:grid-cols-2 gap-8 items-center">

              <div>
                <h2 className="text-3xl font-bold text-[#5b1320] mb-4">
                  {selectedPastor.name}
                </h2>

                <p className="mb-3 text-[#5b1320]">
                  <strong>Years:</strong>{" "}
                  {selectedPastor.joinedYear} - {selectedPastor.leftYear}
                </p>

                <p className="text-[#5b1320] leading-relaxed">
                  {selectedPastor.details}
                </p>
              </div>

              <div className="flex justify-center">

                {selectedPastor.photo || selectedPastor.image?.url ? (
                  <img
                    src={selectedPastor.photo || selectedPastor.image?.url}
                    alt={selectedPastor.name}
                    className="w-72 h-72 object-cover rounded-3xl"
                  />
                ) : (
                  <div className="w-72 h-72 bg-gray-300 rounded-3xl" />
                )}

              </div>

            </div>

          </div>

        </div>
      )}
    </>
  );
}
