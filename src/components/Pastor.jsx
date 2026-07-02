import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { FaTimes } from "react-icons/fa";

export default function Pastor() {
  const { t, cmsData } = useLanguage();
  const styles = cmsData?.pastor?.styles || {};
  const [pastors, setPastors] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchYear, setSearchYear] = useState("");
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const getImage = (pastor) => pastor?.image?.url || "/placeholder.png";

  useEffect(() => {
    const fetchPastors = async () => {
      try {
        setLoading(true);
        const res = await API.get("/pastors");
        setPastors(res.data?.pastors || []);
      } catch (error) {
        console.error("Pastor fetch error:", error);
        setPastors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPastors();
  }, []);

  const currentPastor = pastors.find((p) => p?.isCurrent === true) || null;
  const serviceYears = currentPastor?.joinedYear
    ? new Date().getFullYear() - currentPastor.joinedYear
    : 0;

  const nameSuggestions = useMemo(() => {
    return [...new Set(pastors.map((p) => p?.name).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [pastors]);

  const filteredNameSuggestions = useMemo(() => {
    const query = searchName.trim().toLowerCase();
    if (!query) return nameSuggestions.slice(0, 6);

    return nameSuggestions
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 6);
  }, [nameSuggestions, searchName]);

  const closeModal = () => {
    setModalVisible(false);
    window.setTimeout(() => {
      setShowModal(false);
      setResults([]);
    }, 180);
  };

  useEffect(() => {
    if (!showModal) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showModal]);

  useEffect(() => {
    if (!showModal) {
      setModalVisible(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setModalVisible(true), 0);
    return () => window.clearTimeout(timer);
  }, [showModal]);

  const searchPastors = () => {
    const filtered = pastors.filter((p) => {
      const nameMatch = searchName.trim()
        ? p?.name?.toLowerCase().includes(searchName.toLowerCase())
        : true;

      const yearText = `${p?.joinedYear || ""} ${p?.leftYear || ""}`;
      const yearMatch = searchYear.trim() ? yearText.includes(searchYear) : true;

      return nameMatch && yearMatch;
    });

    setResults(filtered);
    setShowModal(true);
  };

  return (
    <>
      <section id="pastor" className="py-16 px-6" style={{ backgroundColor: styles.backgroundColor || "#5b1320" }}>
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-3xl font-bold" style={{ color: styles.headingColor || "#FFFFFF" }}>{t("pastor.title")}</h2>

          <div className="grid gap-6 lg:grid-cols-4">
            <div className="rounded-3xl p-8 shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl lg:col-span-3" style={{ backgroundColor: styles.cardBackground || "#d8cbb7" }}>
              {loading ? (
                <div className="py-10 text-center font-bold" style={{ color: styles.cardTextColor || "#5b1320" }}>
                  {t("pastor.loading")}
                </div>
              ) : currentPastor ? (
                <div className="grid items-center gap-8 md:grid-cols-2">
                  <div>
                    <h3 className="mb-6 text-xl font-bold" style={{ color: styles.cardTextColor || "#5b1320" }}>
                      {t("pastor.currentPastor")}
                    </h3>

                    <div className="space-y-4" style={{ color: styles.cardTextColor || "#5b1320" }}>
                      <p>
                        <strong>{t("pastor.name")}:</strong> {currentPastor.name}
                      </p>

                      <p>
                        <strong>{t("pastor.role")}:</strong> {currentPastor.role}
                      </p>

                      <p>
                        <strong>{t("pastor.yearsOfService")}:</strong> {serviceYears}{" "}
                        {serviceYears === 1 ? t("pastor.year") : t("pastor.years")}
                      </p>

                      <p>
                        <strong>{t("pastor.bio")}:</strong>{" "}
                        {currentPastor.bio || t("pastor.noBio")}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="group rounded-3xl bg-[#f4efe7] p-2 shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-3xl">
                      <div className="overflow-hidden rounded-[22px] bg-[#5b1320]">
                        <img
                          src={getImage(currentPastor)}
                          alt={currentPastor.name}
                          className="h-64 w-64 object-cover transition-transform duration-700 ease-out group-hover:scale-105 sm:h-72 sm:w-72"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <h3 className="text-2xl font-bold text-[#5b1320]">
                    {t("pastor.noCurrent")}
                  </h3>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-[#d8cbb7] p-6 shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
              <h3 className="mb-2 text-center font-bold text-[#5b1320]">
                {t("pastor.searchTitle")}
              </h3>

              <p className="mb-5 text-center text-sm leading-6 text-[#5b1320]/80">
                Search by name or year to find a pastor quickly.
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("pastor.searchByName")}
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    autoComplete="off"
                    className="w-full rounded-full bg-white px-4 py-3 outline-none shadow-sm transition focus:scale-[1.01] focus:shadow-md"
                  />

                  {searchName.trim() && filteredNameSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#5b1320]/10 bg-[#f4efe7] shadow-2xl">
                      {filteredNameSuggestions.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => setSearchName(name)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#5b1320] transition hover:bg-[#5b1320] hover:text-[#f4efe7]"
                        >
                          <span>{name}</span>
                          <span className="text-xs opacity-70">Match</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative overflow-hidden rounded-full border border-[#5b1320]/10 bg-white shadow-sm transition focus-within:shadow-md focus-within:ring-2 focus-within:ring-[#5b1320]/15">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={t("pastor.searchByYear")}
                    value={searchYear}
                    onChange={(e) =>
                      setSearchYear(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full appearance-none bg-transparent px-4 py-3 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                <button
                  onClick={searchPastors}
                  className="w-full rounded-full bg-[#5b1320] py-3 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#441018] hover:shadow-xl"
                >
                  {t("pastor.search")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 transition-opacity duration-200 ${modalVisible ? "opacity-100" : "opacity-0"
            }`}
          onClick={closeModal}
        >
          <div
            className={`relative max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-white/40 bg-[#d8cbb7] shadow-2xl transition-all duration-300 ease-out ${modalVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-3 scale-95 opacity-0"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#5b1320]/10 px-5 pb-4 pt-5 sm:px-8 sm:pt-6">
              <h2 className="text-xl font-bold text-[#5b1320] sm:text-2xl">
                {t("pastor.results")}
              </h2>

              <button
                onClick={closeModal}
                aria-label="Close search results"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5b1320] text-white shadow-sm transition hover:scale-105 hover:bg-[#3f0d17]"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="px-5 pb-6 pt-6 sm:px-8">
              {results.length === 0 ? (
                <div className="py-12 text-center">
                  <h3 className="text-3xl font-bold text-red-600">
                    {t("pastor.noPastorFound")}
                  </h3>
                </div>
              ) : (
                results.map((p) => (
                  <div
                    key={p._id}
                    className="mb-6 border-b border-[#5b1320]/15 pb-6 last:mb-0 last:border-b-0"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:gap-6">
                      <div className="group shrink-0 overflow-hidden rounded-2xl bg-[#5b1320] shadow-md">
                        <img
                          src={getImage(p)}
                          alt={p.name}
                          className="h-32 w-32 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </div>

                      <div className="pt-1">
                        <h3 className="text-lg font-bold text-[#5b1320] sm:text-xl">
                          {p.name}
                        </h3>

                        {p.isCurrent && (
                          <span className="mt-2 inline-block rounded-full bg-green-600 px-3 py-1 text-xs text-white">
                            {t("pastor.currentLabel")}
                          </span>
                        )}

                        <p className="mt-3 text-[#5b1320]">
                          {p.joinedYear} - {p.leftYear || t("pastor.present")}
                        </p>

                        <p className="mt-3 leading-6 text-[#5b1320]">
                          {p.bio || t("pastor.noBio")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
