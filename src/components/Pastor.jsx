import React, { useEffect, useMemo, useState, memo } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { FaTimes, FaCalendarAlt } from "react-icons/fa";
import { getFallbackAvatar, handleImageError } from "../utils/avatarFallback";
import { ShieldCheck, UserRound, Cross, CalendarDays, Quote, ChevronRight } from "lucide-react";

const Pastor = memo(function Pastor({ initialPastors }) {
  const { t } = useLanguage();
  const [pastors, setPastors] = useState(() => initialPastors || []);
  const [searchName, setSearchName] = useState("");
  const [searchYear, setSearchYear] = useState("");
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(() => !initialPastors);
  const [activeTab, setActiveTab] = useState("search");

  const getImage = (pastor) => pastor?.image?.url || getFallbackAvatar();

  useEffect(() => {
    if (initialPastors) {
      setPastors(initialPastors);
      setLoading(false);
      return;
    }

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
  }, [initialPastors]);

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
    const sName = searchName.trim().toLowerCase();
    const sYear = searchYear.trim();

    // If both empty, return all pastors
    if (!sName && !sYear) {
      setResults(pastors);
      setShowModal(true);
      return;
    }

    const filtered = pastors.filter((p) => {
      let nameMatch = true;
      if (sName) {
        nameMatch = p?.name?.toLowerCase().includes(sName);
      }

      let yearMatch = true;
      if (sYear) {
        const queryYear = parseInt(sYear, 10);
        if (!isNaN(queryYear)) {
          // Safely parse start year
          let startYear;
          if (typeof p?.joinedYear === "number") {
            startYear = p.joinedYear;
          } else if (typeof p?.joinedYear === "string") {
            startYear = parseInt(p.joinedYear, 10);
          } else if (p?.joinedYear != null) {
            startYear = parseInt(String(p.joinedYear), 10);
          } else {
            startYear = NaN;
          }

          // Safely parse end year
          let endYear;
          const leftVal = p?.leftYear;

          if (leftVal == null || leftVal === "") {
            endYear = new Date().getFullYear();
          } else if (typeof leftVal === "string") {
            const lower = leftVal.trim().toLowerCase();
            if (lower === "present" || lower === "current") {
              endYear = new Date().getFullYear();
            } else {
              endYear = parseInt(leftVal, 10);
            }
          } else if (typeof leftVal === "number") {
            endYear = leftVal;
          } else {
            endYear = parseInt(String(leftVal), 10);
          }

          if (!isNaN(startYear) && !isNaN(endYear)) {
            yearMatch = queryYear >= startYear && queryYear <= endYear;
          } else if (!isNaN(startYear)) {
            yearMatch = queryYear >= startYear && queryYear <= new Date().getFullYear();
          } else {
            yearMatch = false;
          }
        } else {
          yearMatch = false;
        }
      }

      return nameMatch && yearMatch;
    });

    setResults(filtered);
    setShowModal(true);
  };

  return (
    <>
      <section id="pastor" className="py-16 bg-[#54091b]">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mb-6 lg:mb-8">
            <h2 className="text-3xl font-bold text-[#F4EFE7]">{t("Pastor")}</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-4 lg:items-start">
            <div 
              className="rounded-3xl p-8 shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl lg:col-span-3 flex flex-col justify-center lg:h-[400px]"
              style={{ background: "linear-gradient(180deg, #E7DAC3 0%, #DDD0B8 100%)" }}
            >
              {loading ? (
                <div className="py-10 text-center text-base font-bold text-[#1E293B]">
                  {t("Loading...")}
                </div>
              ) : currentPastor ? (
                <div className="grid items-center gap-8 md:grid-cols-2">
                  <div className="relative flex items-center group/info transition-all duration-300">
                    {/* Left Gold Accent */}
                    <div 
                      className="absolute left-[-16px] md:left-[-24px] top-1/2 -translate-y-1/2 w-[4px] h-[90px] rounded-full" 
                      style={{ background: "#D4AF37", boxShadow: "0 0 10px rgba(212,175,55,0.4)" }}
                    ></div>

                    <div className="w-full">
                      {/* Premium Heading */}
                      <div className="mb-6 border-b border-[#D4AF37]/30 pb-3 relative overflow-hidden">
                        <div className="flex items-center gap-3">
                          <ShieldCheck size={28} color="#D4AF37" />
                          <h3 className="text-[34px] font-[800] text-[#5B0E21] tracking-[-0.5px]">
                            {t("Current Pastor")}
                          </h3>
                        </div>
                        {/* Heading Underline Animation */}
                        <div className="absolute bottom-0 left-0 h-[2px] bg-[#D4AF37] w-0 transition-all duration-500 group-hover/info:w-full"></div>
                      </div>

                      <div className="space-y-4">
                        {/* Name Row */}
                        <div 
                          className="flex items-center gap-4 rounded-[16px] px-[16px] py-[14px] transition-all duration-300 hover:translate-x-[6px] border border-white/40 hover:border-[#D4AF37] hover:shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
                          style={{
                            background: "rgba(255,255,255,0.25)",
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          <div className="flex w-[42px] h-[42px] shrink-0 items-center justify-center rounded-full border border-[#7A0F24]/12 bg-[#F6EFE4]">
                            <UserRound size={20} color="#7A0F24" />
                          </div>
                          <div>
                            <p className="text-[12px] font-[700] tracking-[2px] uppercase text-[#8A6D58]">
                              {t("NAME")}
                            </p>
                            <p className="text-[22px] font-[700] text-[#2F3545] leading-[1.2]">
                              {currentPastor.name}
                            </p>
                          </div>
                        </div>

                        {/* Role Row */}
                        <div 
                          className="flex items-center gap-4 rounded-[16px] px-[16px] py-[14px] transition-all duration-300 hover:translate-x-[6px] border border-white/40 hover:border-[#D4AF37] hover:shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
                          style={{
                            background: "rgba(255,255,255,0.25)",
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          <div className="flex w-[42px] h-[42px] shrink-0 items-center justify-center rounded-full border border-[#7A0F24]/12 bg-[#F6EFE4]">
                            <Cross size={20} color="#7A0F24" />
                          </div>
                          <div>
                            <p className="text-[12px] font-[700] tracking-[2px] uppercase text-[#8A6D58]">
                              {t("ROLE")}
                            </p>
                            <p className="text-[22px] font-[700] text-[#2F3545] leading-[1.2]">
                              {t(currentPastor.role)}
                            </p>
                          </div>
                        </div>

                        {/* Ministry Row */}
                        <div 
                          className="flex items-center gap-4 rounded-[16px] px-[16px] py-[14px] transition-all duration-300 hover:translate-x-[6px] border border-white/40 hover:border-[#D4AF37] hover:shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
                          style={{
                            background: "rgba(255,255,255,0.25)",
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          <div className="flex w-[42px] h-[42px] shrink-0 items-center justify-center rounded-full border border-[#7A0F24]/12 bg-[#F6EFE4]">
                            <CalendarDays size={20} color="#7A0F24" />
                          </div>
                          <div>
                            <p className="text-[12px] font-[700] tracking-[2px] uppercase text-[#8A6D58]">
                              {t("MINISTRY")}
                            </p>
                            <p className="text-[22px] font-[700] text-[#2F3545] leading-[1.2]">
                              {t("Serving for")} {serviceYears} {serviceYears === 1 ? t("Year") : t("Years")}
                            </p>
                          </div>
                        </div>

                        {/* Quote Section */}
                        <div className="mt-[18px] flex items-start gap-3 pr-4">
                          <Quote size={20} color="#D4AF37" className="shrink-0 mt-0.5" />
                          <p className="text-[15px] italic text-[#6B6B6B]">
                            {currentPastor.bio?.trim() ? t(currentPastor.bio) : t("Serving God's people with faith, love and prayer.")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="group rounded-3xl bg-[#f4efe7] p-2 shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-3xl">
                      <div className="overflow-hidden rounded-[22px] bg-[#54091b]">
                        <img
                          src={getImage(currentPastor)}
                          alt={currentPastor.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => handleImageError(e)}
                          className="pastor-placeholder transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <h3 className="text-2xl font-bold text-[#54091b]">
                    {t("No Current Pastor Selected")}
                  </h3>
                </div>
              )}
            </div>

            <div className="flex flex-col rounded-3xl bg-[#d8cbb7] p-6 shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl lg:h-[400px]">
              <div className="mb-6 flex rounded-full bg-[#54091b]/10 p-1 shrink-0">
                <button
                  onClick={() => setActiveTab("search")}
                  className={`flex-1 rounded-full py-2 text-sm font-bold transition-all ${
                    activeTab === "search"
                      ? "bg-[#54091b] text-white shadow"
                      : "text-[#54091b] hover:bg-[#54091b]/5"
                  }`}
                >
                  {t("Search")}
                </button>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`flex-1 rounded-full py-2 text-sm font-bold transition-all ${
                    activeTab === "timeline"
                      ? "bg-[#54091b] text-white shadow"
                      : "text-[#54091b] hover:bg-[#54091b]/5"
                  }`}
                >
                  {t("Timeline")}
                </button>
              </div>

              {activeTab === "search" ? (
                <div className="flex-1 flex flex-col justify-center space-y-4 overflow-hidden">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("Search By Name")}
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") searchPastors();
                    }}
                    autoComplete="off"
                    className="w-full rounded-full bg-white px-4 py-3 outline-none shadow-sm transition focus:scale-[1.01] focus:shadow-md"
                  />

                  {searchName.trim() && filteredNameSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#54091b]/10 bg-[#f4efe7] shadow-2xl">
                      {filteredNameSuggestions.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => setSearchName(name)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#54091b] transition hover:bg-[#54091b] hover:text-[#f4efe7]"
                        >
                          <span>{name}</span>
                          <span className="text-xs opacity-70">Match</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative overflow-hidden rounded-full border border-[#54091b]/10 bg-white shadow-sm transition focus-within:shadow-md focus-within:ring-2 focus-within:ring-[#54091b]/15">
                  <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-[#54091b]/50" />
                  <input
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    step="1"
                    inputMode="numeric"
                    placeholder={t("Select or enter a year")}
                    value={searchYear}
                    onChange={(e) =>
                      setSearchYear(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") searchPastors();
                    }}
                    className="w-full appearance-none bg-transparent py-3 pl-11 pr-4 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                <button
                  onClick={searchPastors}
                  className="w-full rounded-full bg-[#54091b] py-3 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#441018] hover:shadow-xl"
                >
                  {t("Search")}
                </button>
                </div>
              ) : (
                <div className="timeline-container flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2">
                  <div className="relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-[2px] before:bg-[#54091b]/20">
                    {pastors.filter(p => !p.isCurrent).length > 0 ? (
                      pastors.filter(p => !p.isCurrent).map(p => (
                        <div key={p._id} className="relative flex items-center group cursor-pointer h-[80px] shrink-0" onClick={() => { setSearchYear(String(p.joinedYear)); searchPastors(); }}>
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border-[4px] border-[#d8cbb7] bg-[#54091b] shrink-0 z-10 transition-transform duration-300 group-hover:scale-125 group-hover:bg-[#441018]"></div>
                          <div className="ml-4 py-2">
                            <span className="font-bold text-[#54091b] text-sm">{p.joinedYear} - {p.leftYear || t("Present")}</span>
                            <h5 className="font-semibold text-[#1E293B] text-sm">{p.name}</h5>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-[#54091b]/70 italic mt-10">{t("No timeline data.")}</p>
                    )}
                  </div>
                </div>
              )}
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
            <div className="flex items-center justify-between gap-4 border-b border-[#54091b]/10 px-5 pb-4 pt-5 sm:px-8 sm:pt-6">
              <h2 className="text-xl font-bold text-[#54091b] sm:text-2xl">
                {t("Search Results")}
              </h2>

              <button
                onClick={closeModal}
                aria-label="Close search results"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#54091b] text-white shadow-sm transition hover:scale-105 hover:bg-[#3f0d17]"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="px-5 pb-6 pt-6 sm:px-8">
              {results.length === 0 ? (
                <div className="py-12 text-center">
                  <h3 className="text-3xl font-bold text-[#54091b]">
                    {searchYear && !searchName
                      ? t("No pastors served during this year.")
                      : t("No Pastor Found")}
                  </h3>
                </div>
              ) : (
                results.map((p) => (
                  <div
                    key={p._id}
                    className="mb-6 border-b border-[#54091b]/15 pb-6 last:mb-0 last:border-b-0"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:gap-6">
                      <div className="group shrink-0 overflow-hidden rounded-2xl bg-[#54091b] shadow-md">
                        <img
                          src={getImage(p)}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => handleImageError(e)}
                          className="pastor-placeholder transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </div>

                      <div className="pt-1">
                        <h3 className="text-lg font-bold text-[#54091b] sm:text-xl">
                          {p.name}
                        </h3>

                        {p.isCurrent && (
                          <span className="mt-2 inline-block rounded-full bg-green-600 px-3 py-1 text-xs text-white">
                            {t("Current Pastor")}
                          </span>
                        )}

                        <p className="mt-3 text-[#54091b]">
                          {p.joinedYear} - {p.leftYear || t("Present")}
                        </p>

                        {p.bio?.trim() && (
                          <p className="mt-3 leading-6 text-[#54091b]">
                            {t(p.bio)}
                          </p>
                        )}
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
});

export default Pastor;
