import { useState, useEffect, useMemo, useRef } from "react";
import API from "../api/axios";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Music, ExternalLink, Loader2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Songs() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Search state from URL
  const search = searchParams.get("q") || "";

  // Multiple categories support from URL
  const categoryParam = searchParams.get("category") || "";
  const pageParam = searchParams.get("page") || "1";
  const selectedCategories = useMemo(() => (categoryParam ? categoryParam.split(",") : ["All"]), [categoryParam]);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const searchRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateParams = (newSearch, newCategories, newPage = 1) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("q", newSearch);
    if (newCategories && newCategories.length > 0 && !newCategories.includes("All")) {
      params.set("category", newCategories.join(","));
    }
    if (newPage > 1) params.set("page", newPage.toString());
    setSearchParams(params, { replace: true });
  };

  const pollTimeout = useRef(null);

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimeout.current) clearTimeout(pollTimeout.current);
    };
  }, []);

  const fetchSongs = async (query, categories, pageNum = 1, isPolling = false) => {
    if (!isPolling) setLoading(true);
    setError(null);
    if (pollTimeout.current) clearTimeout(pollTimeout.current);

    try {
      const categoryParam = categories.includes("All") ? "" : categories.join(",");
      const res = await API.get(
        `/songs?search=${encodeURIComponent(query)}&category=${encodeURIComponent(categoryParam)}&page=${pageNum}&limit=10`
      );

      if (res.data.status === "searching_online") {
        setLoading(true);
        pollTimeout.current = setTimeout(() => fetchSongs(query, categories, pageNum, true), 3000);
      } else {
        setSongs(res.data.songs || []);
        setTotalPages(res.data.totalPages || 1);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server. Please check your internet connection and try again.");
      setLoading(false);
    }
  };

  // Live autocomplete fetch
  const fetchSuggestions = async (query, categories) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    setSuggestionsLoading(true);
    try {
      const categoryParam = categories.includes("All") ? "" : categories.join(",");
      const res = await API.get(`/songs?search=${encodeURIComponent(query)}&category=${encodeURIComponent(categoryParam)}`);
      setSuggestions((res.data.songs || []).slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Debounce logic for suggestions
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search) {
        fetchSuggestions(search, selectedCategories);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedCategories]);

  // Initial load or when URL changes
  useEffect(() => {
    const currentPage = parseInt(pageParam, 10) || 1;
    setPage(currentPage);
    fetchSongs(search, selectedCategories, currentPage);
  }, [search, selectedCategories, pageParam]);

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (songTitle) => {
    updateParams(songTitle, selectedCategories);
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-[#F4EFE7] pt-12 pb-24 font-sans">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-[#54091b] tracking-tight mb-4">
            {t("Search Christan Songs")}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            {t("Search for lyrics across multiple trusted sources and hymn books." )}
          </p>
        </div>

        {/* Sticky Search & Categories Container */}
        <div
          className="sticky z-40 bg-[#F4EFE7] pt-4 pb-4 mb-8 -mx-5 px-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-[#E8DCCB] shadow-sm transition-all"
          style={{ top: "var(--navbar-height)" }}
        >
          {/* Controls Bar */}
          <div className="max-w-3xl mx-auto flex flex-col gap-4 mb-4 relative z-50">
            {/* Search Bar with Autocomplete */}
            <div className="relative group flex-1" ref={searchRef}>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-[#54091b]/40 group-focus-within:text-[#54091b] transition-colors" />
                </div>
                <input
                  type="text"
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-lg focus:outline-none focus:border-[#54091b] transition-all shadow-sm text-slate-900 placeholder-slate-400 font-medium"
                  placeholder={t("Search songs by title or lyrics...")}
                  value={search}
                  onChange={(e) => {
                    updateParams(e.target.value, selectedCategories);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleSearchSubmit}
                  onFocus={() => setShowSuggestions(true)}
                />
                {suggestionsLoading && (
                  <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                    <Loader2 className="h-5 w-5 text-[#54091b] animate-spin" />
                  </div>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showSuggestions && search && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider pl-4">
                    Suggestions
                  </div>
                  <ul className="max-h-80 overflow-y-auto resources-scrollbar">
                    {suggestions.map((song, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSuggestionClick(song.title)}
                        className="px-4 py-3 hover:bg-[#F4EFE7] cursor-pointer transition-colors border-b border-slate-50 last:border-none flex items-center gap-3"
                      >
                        <Music size={16} className="text-[#54091b]/50 shrink-0" />
                        <div className="flex-1 truncate">
                          <div className="font-bold text-[#1E293B] truncate">{song.title}</div>
                          <div className="text-xs text-slate-500 truncate">{song.lyrics}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div
                    className="p-3 bg-slate-50 text-center text-sm font-bold text-[#54091b] cursor-pointer hover:bg-slate-100 transition-colors border-t border-slate-100"
                    onClick={() => {
                      setShowSuggestions(false);
                      setPage(1);
                      fetchSongs(search, selectedCategories, 1);
                    }}
                  >
                    See all results →
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#54091b]/20 border-t-[#54091b]"></div>
            <p className="text-[#54091b]">
              {search ? t("Searching Christian song libraries... This might take a few seconds.") : t("Loading songs...")}
            </p>
          </div>
        ) : error ? (
          <div className="max-w-2xl mx-auto bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100 shadow-sm">
            <h3 className="text-xl font-bold mb-2">{t("Unable to load songs")}</h3>
            <p className="mb-6 opacity-80">{error}</p>
            <button
              onClick={() => fetchSongs(search, selectedCategories)}
              className="px-8 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors shadow-md"
            >
              {t("Retry")}
            </button>
          </div>
        ) : songs.length > 0 ? (
          <div className="space-y-5 max-w-3xl mx-auto">
            {songs.map((song, idx) => (
              <Link
                to={`/songs/${encodeURIComponent(song.url)}`}
                state={{ song }}
                key={idx}
                className="group block bg-white rounded-[20px] p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_-4px_rgba(84,9,27,0.15)] transition-all duration-300 hover:-translate-y-1.5 border border-[#E8DCCB] relative overflow-hidden"
              >
                {/* Accent glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/0 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="flex items-start gap-4 sm:gap-6 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-[#F4EFE7] flex items-center justify-center shrink-0 group-hover:bg-[#54091b] group-hover:shadow-md transition-all duration-300">
                    <Music className="w-5 h-5 text-[#54091b] group-hover:text-[#F6EFE3] transition-colors" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-[#1E293B] truncate group-hover:text-[#54091b] transition-colors tracking-tight">
                        {song.titleTamil || song.title}
                      </h3>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-[#D4AF37]/10 transition-colors">
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#D4AF37] transition-colors" />
                      </div>
                    </div>

                    {song.titleEnglish && (
                      <div className="text-sm font-medium text-slate-500 mb-2 truncate">
                        {song.titleEnglish}
                      </div>
                    )}

                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 font-serif opacity-90 group-hover:opacity-100 transition-opacity mb-4">
                      {song.lyricsTamil || song.lyrics || t("Lyrics preview not available.")}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      {song.category && (
                        <span className="inline-flex items-center gap-1 bg-[#F4EFE7] text-[#54091b]/80 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider border border-[#E8DCCB]">
                          {song.category}
                        </span>
                      )}
                      {song.artist && (
                        <span className="text-xs text-slate-500 font-medium ml-auto">
                          {song.artist}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-12 mb-8">
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    updateParams(search, selectedCategories, page - 1);
                  }}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#54091b] hover:border-[#54091b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center"
                >
                  &laquo; {t("Previous")}
                </button>

                <div className="hidden sm:flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1;
                    if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
                      return (
                        <button
                          key={p}
                          onClick={() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            updateParams(search, selectedCategories, p);
                          }}
                          className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all shadow-sm ${
                            page === p
                              ? "bg-[#54091b] text-white border-none"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#54091b] hover:border-[#54091b]"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }

                    if (p === page - 3 || p === page + 3) {
                      return <span key={p} className="text-slate-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <div className="sm:hidden flex items-center gap-2 mx-2">
                  <span className="font-bold text-[#54091b]">Page {page} of {totalPages}</span>
                </div>

                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    updateParams(search, selectedCategories, page + 1);
                  }}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#54091b] hover:border-[#54091b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center"
                >
                  {t("Next")} &raquo;
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-24 bg-white/50 rounded-[24px] border border-[#E8DCCB] shadow-sm max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
              <Music className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">{t("No songs found")}</h3>
            <p className="text-slate-500 font-medium">
              {search 
                ? t("Lyrics are being verified from trusted providers. Please try again shortly.") 
                : t("Try adjusting your search terms or selecting a different category.")}
            </p>
            {search && (
              <button
                onClick={() => {
                  updateParams("", selectedCategories);
                }}
                className="mt-6 px-6 py-2.5 bg-white border border-[#E8DCCB] text-[#54091b] rounded-full font-bold hover:bg-[#F4EFE7] transition-colors shadow-sm"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
