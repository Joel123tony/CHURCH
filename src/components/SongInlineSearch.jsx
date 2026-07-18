import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Music } from "lucide-react";
import API from "../api/axios";

export default function SongInlineSearch({ className = "" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const navigate = useNavigate();
  const searchRef = useRef(null);
  
  // Local cache for quick lookup
  const cache = useRef({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (cache.current[query]) {
        setResults(cache.current[query]);
        setIsOpen(true);
        setSelectedIndex(-1);
        return;
      }

      setLoading(true);
      try {
        const res = await API.get(`/songs?search=${encodeURIComponent(query)}&limit=8`);
        const songs = res.data.success ? res.data.data : [];
        cache.current[query] = songs;
        setResults(songs);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        // Default select first result if none highlighted
        handleSelect(results[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (song) => {
    setQuery("");
    setIsOpen(false);
    navigate(`/songs/${encodeURIComponent(song.url)}`, { state: { song } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`relative w-full ${className}`} ref={searchRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 text-slate-400" size={16} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          placeholder="Search another song..."
          className="w-full bg-white border border-[#E8DCCB] rounded-[10px] pl-10 pr-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
        />
        {loading && (
          <div className="absolute right-4 w-4 h-4 border-2 border-slate-200 border-t-[#D4AF37] rounded-full animate-spin"></div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-[16px] border border-[#E8DCCB] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {results.length > 0 ? (
            <div className="max-h-[320px] overflow-y-auto p-1.5">
              {results.map((song, idx) => (
                <button
                  key={song._id || idx}
                  onClick={() => handleSelect(song)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-[10px] transition-colors ${
                    selectedIndex === idx ? "bg-[#F8F4EC]" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedIndex === idx ? "bg-white shadow-sm text-[#54091b]" : "bg-[#F4EFE7] text-slate-400"}`}>
                    <Music size={14} />
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-sm font-bold text-slate-800 truncate">
                      {song.titleTamil || song.title}
                    </div>
                    {(song.artist || song.category) && (
                      <div className="text-xs font-medium text-slate-500 truncate mt-0.5">
                        {song.artist ? `${song.artist} • ` : ""}{song.category}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : !loading ? (
            <div className="p-6 text-center text-sm font-medium text-slate-500">
              No matching songs found.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
