import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { Search, Music, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function SongLyrics() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const searchInputRef = useRef(null);
  const listContainerRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    setCurrentPage(1);
    fetchSongs();
  }, [searchQuery]);

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/song-lyrics?search=${encodeURIComponent(searchQuery)}&sort=alphabetical`);
      setSongs(res.data.data);
    } catch (err) {
      console.error("Failed to load songs");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (listContainerRef.current) {
      const yOffset = -100;
      const y = listContainerRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const totalPages = Math.ceil(songs.length / ITEMS_PER_PAGE);
  const currentSongs = songs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#F4EFE7] pb-20">
      
      {/* =========================
          STICKY SECONDARY NAV 
      ========================= */}
      <div className="sticky top-20 z-40 bg-[#F4EFE7] border-b border-[#d4af37]/20 shadow-sm pt-4 pb-4">
        <div className="container-custom mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#531B24]">{t("Song Lyrics")}</h1>
            
            {/* Search Bar */}
            <div className="relative shadow-sm rounded-xl bg-white flex items-center p-1 sm:p-1.5 border border-[#d4af37]/30 w-full sm:w-80 shrink-0">
              <Search className="h-5 w-5 text-slate-400 ml-2.5 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t("Search songs...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-base focus:outline-none text-slate-800"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-full mr-1 shrink-0"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom mx-auto px-4 sm:px-6">

        <div ref={listContainerRef} className="max-w-3xl mx-auto mt-10">


          {/* Song List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#531B24]/20 border-t-[#531B24]" />
            </div>
          ) : songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-[#d4af37]/20 shadow-sm">
              <Music className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium text-lg">{t("No songs found.")}</p>
            </div>
          ) : (
            <div className="flex flex-col border-t border-[#531B24]/10 mt-6">
              {currentSongs.map((song) => (
                <Link 
                  key={song._id} 
                  to={`/song-lyrics/${song._id}`}
                  className="group block py-4 sm:py-5 border-b border-[#531B24]/10 hover:bg-[#531B24]/5 transition-colors px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-xl sm:rounded-none"
                >
                  <h3 className="font-bold text-lg sm:text-xl text-[#531B24] group-hover:text-[#ee0039] transition-colors break-words">
                    {song.titleTamil || song.title}
                  </h3>
                  {song.titleEnglish && (
                    <p className="text-sm sm:text-base font-medium text-slate-600 opacity-80 mt-1 sm:mt-1.5 break-words">
                      {song.titleEnglish}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 mb-6 flex flex-wrap justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#531B24]/20 text-[#531B24] hover:bg-[#531B24]/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-lg"
                aria-label="Previous page"
              >
                ‹
              </button>
              
              <div className="flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                      currentPage === pageNum 
                        ? 'bg-[#531B24] text-white shadow-md' 
                        : 'border border-[#531B24]/20 text-[#531B24] hover:bg-[#531B24]/5 hover:border-[#531B24]/40'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#531B24]/20 text-[#531B24] hover:bg-[#531B24]/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-lg"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
