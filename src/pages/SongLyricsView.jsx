import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { Search, X, Sun, Moon, Download } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function SongLyricsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // Global search
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchDebounceRef = useRef(null);
  const searchInputRef = useRef(null);

  // Reader state
  const [theme, setTheme] = useState(localStorage.getItem("lyricsTheme") || "light");
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem("lyricsFontSize")) || 20);

  useEffect(() => {
    fetchSong();
  }, [id]);

  useEffect(() => {
    localStorage.setItem("lyricsTheme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lyricsFontSize", fontSize);
  }, [fontSize]);

  const fetchSong = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/song-lyrics/${id}`);
      setSong(res.data.data);
    } catch (err) {
      console.error("Failed to load song");
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSearch = (query) => {
    setGlobalSearch(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await API.get(`/song-lyrics?search=${encodeURIComponent(query)}&sort=alphabetical`);
        setSearchResults(res.data.data);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Search failed");
      }
    }, 300);
  };

  const selectSearchResult = (songId) => {
    setGlobalSearch("");
    setShowSearchResults(false);
    navigate(`/song-lyrics/${songId}`);
  };

  const handleDownloadPPT = async () => {
    if (!song?.originalFileUrl) return;

    setIsDownloading(true);
    
    // Construct base filename
    const safeTamil = (song.titleTamil || "").trim();
    const safeEnglish = (song.titleEnglish || "").trim();
    
    let baseName = "";
    if (safeTamil && safeEnglish) {
      baseName = `${safeTamil} - ${safeEnglish}`;
    } else {
      baseName = safeTamil || safeEnglish || "Song";
    }
    
    // Sanitize filename characters: < > : " / \ | ? * and collapse extra spaces
    baseName = baseName.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim();
    
    // Get extension
    let ext = ".pptx";
    if (song.originalFileName) {
      const match = song.originalFileName.match(/\.(pptx?)$/i);
      if (match) ext = match[0];
    } else if (song.originalFileType) {
      ext = `.${song.originalFileType}`;
    }
    
    const filename = `${baseName}${ext}`;

    try {
      // Fetch as blob to force download with correct filename across origins (Cloudinary)
      const response = await fetch(song.originalFileUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback if fetch fails (e.g., CORS)
      const link = document.createElement('a');
      link.href = song.originalFileUrl;
      link.setAttribute('download', filename);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EFE7] pt-24 pb-20 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#531B24]/20 border-t-[#531B24]" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-[#F4EFE7] pt-24 pb-20 flex flex-col items-center justify-center">
        <p className="text-xl text-slate-600 mb-6 font-medium">Song not found</p>
        <Link to="/song-lyrics" className="text-[#531B24] font-bold hover:underline">
          &larr; Back to Songs
        </Link>
      </div>
    );
  }

  // Parse and render lyrics text
  const renderLyricsSection = (textBlock, titleText) => {
    if (!textBlock) return null;

    // Normalize Windows CRLF to LF, then split by 2 or more newlines to get stanzas
    const paragraphs = textBlock.replace(/\r\n/g, '\n').split(/\n{2,}/);

    const rendered = paragraphs.map((para, i) => {
      const isVerse = /^\d+[\.\)]/.test(para.trim());
      return (
        <div key={i} className={`mb-8 whitespace-pre-line ${isVerse ? 'pl-4 sm:pl-6 border-l-4 border-[#d4af37]/40' : 'font-bold opacity-90'}`}>
          {para}
        </div>
      );
    });

    return (
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-5 opacity-80 border-b pb-2 inline-block border-current/20">{titleText}</h2>
        {rendered}
      </div>
    );
  };

  const isDark = theme === 'dark';
  const isPPT = song.originalFileType === 'ppt' || song.originalFileType === 'pptx';

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-[#F4EFE7] text-slate-800'}`}>

      {/* =========================
          STICKY SONG SECTION NAV 
      ========================= */}
      <div className={`sticky top-20 z-40 border-b transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-700 shadow-black/20 shadow-sm' : 'bg-[#F4EFE7] border-[#d4af37]/20 shadow-sm'}`}>
        <div className="container-custom mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto py-2.5">

            {/* Global Search Bar */}
            <div className="relative mb-2 z-50">
              <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search songs..."
                  value={globalSearch}
                  onChange={e => handleGlobalSearch(e.target.value)}
                  onFocus={() => { if (globalSearch) setShowSearchResults(true); }}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl shadow-sm border focus:outline-none focus:ring-2 focus:ring-[#531B24] transition-colors text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-800'}`}
                />
                {globalSearch && (
                  <button onClick={() => { setGlobalSearch(""); setShowSearchResults(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showSearchResults && searchResults.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#d4af37]/20'}`}>
                  <ul className="max-h-64 overflow-y-auto admin-scrollbar">
                    {searchResults.map(res => (
                      <li key={res._id}>
                        <button onClick={() => selectSearchResult(res._id)} className={`w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                          <p className="font-bold text-sm">{res.titleTamil || res.title}</p>
                          {res.titleEnglish && <p className="text-[11px] opacity-70 italic mt-0.5">{res.titleEnglish}</p>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Title & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="min-w-0 pr-4">
                <h1 className={`text-lg sm:text-xl font-bold leading-tight mb-1 truncate ${isDark ? 'text-white' : 'text-[#531B24]'}`}>
                  {song.titleTamil || song.title}
                </h1>
                {song.titleEnglish && (
                  <div className="text-sm font-medium opacity-70 italic truncate thanglish">
                    {song.titleEnglish}
                  </div>
                )}
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto shrink-0 mt-1 sm:mt-0 song-controls">
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-white shadow-sm hover:bg-slate-50 border border-slate-200'}`}
                  title="Toggle Light/Dark Mode"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <div className={`flex items-center gap-2 rounded-lg p-1 px-1.5 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white shadow-sm border border-slate-200'}`}>
                  <button
                    onClick={() => setFontSize(Math.max(16, fontSize - 2))}
                    disabled={fontSize <= 16}
                    className="px-1 py-0.5 rounded-md font-bold hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors text-sm"
                  >
                    A−
                  </button>
                  <span className="w-6 text-center text-sm font-semibold opacity-80">{fontSize}</span>
                  <button
                    onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                    disabled={fontSize >= 28}
                    className="px-1 py-0.5 rounded-md font-bold hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-colors text-sm"
                  >
                    A+
                  </button>
                </div>

                {isPPT && (
                  <button
                    onClick={handleDownloadPPT}
                    disabled={isDownloading}
                    className="ml-auto md:ml-0 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-[#531B24] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold tracking-wide text-white transition-colors hover:bg-[#6c232f] shadow-sm disabled:opacity-50 disabled:cursor-wait"
                    title="Download PPT"
                  >
                    {isDownloading ? (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                    <span>Download PPT</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =========================
          LYRICS CONTENT 
      ========================= */}
      <div className="container-custom mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        <div className="max-w-4xl mx-auto">
          <div
            className="font-medium leading-relaxed transition-all duration-300"
            style={{ fontSize: `${fontSize}px` }}
          >
            {renderLyricsSection(song.lyricsText, "தமிழ்")}

            {song.lyricsThanglish && song.thanglishStatus !== "needs_review" && (
              <>
                <div className={`my-10 border-t ${isDark ? 'border-white/10' : 'border-[#531B24]/10'}`}></div>
                {renderLyricsSection(song.lyricsThanglish, "Thanglish")}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
