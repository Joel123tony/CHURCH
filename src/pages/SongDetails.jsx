import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { ChevronLeft, AlertCircle, RefreshCw, ZoomIn, ZoomOut, RotateCcw, Moon, Sun } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import SongInlineSearch from "../components/SongInlineSearch";

export default function SongDetails() {
  const { id } = useParams();
  const location = useLocation();
  const { t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const isDark = isDarkMode;

  const [songLyrics, setSongLyrics] = useState(null);
  const [songSections, setSongSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTab, setActiveTab] = useState('tamil');

  const [songMeta] = useState(location.state?.song || {
    title: t("Song Details"),
    category: t("Unknown"),
    source: t("Unknown"),
    language: "Tamil"
  });

  const fetchSongDetails = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    setError(null);
    try {
      // Only skip fetch if we have lyrics AND they are not pending
      if (songMeta.lyricsTamil && songMeta.lyricsTamil !== "pending_fetch" && !isPolling) {
         setSongLyrics(songMeta.lyricsTamil);
         if (songMeta.aiSections && songMeta.aiSections.length > 0) {
           setSongSections(songMeta.aiSections);
         } else if (songMeta.aiMetadata?.sections && songMeta.aiMetadata.sections.length > 0) {
           setSongSections(songMeta.aiMetadata.sections);
         }
         setLoading(false);
         return;
      }
      
      const res = await API.get(`/songs/details?url=${encodeURIComponent(decodeURIComponent(id))}&title=${encodeURIComponent(songMeta.title || songMeta.titleTamil)}`);
      if (res.data.success && res.data.data) {
        setSongLyrics(res.data.data.lyrics);
        if (res.data.data.aiSections && res.data.data.aiSections.length > 0) {
           setSongSections(res.data.data.aiSections);
        } else if (res.data.data.aiMetadata?.sections && res.data.data.aiMetadata.sections.length > 0) {
           setSongSections(res.data.data.aiMetadata.sections);
        }
      } else {
        setError("Song lyrics not found");
      }
    } catch (err) {
      console.error(err);
      if (!isPolling) setError("Unable to connect to the server. Please try again.");
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [id, songMeta.lyricsTamil, songMeta.title, songMeta.titleTamil]);

  useEffect(() => {
    fetchSongDetails();
  }, [fetchSongDetails]);

  // Polling logic for pending_fetch
  useEffect(() => {
    let interval;
    if (songLyrics === "pending_fetch" || songLyrics === "pending") {
        interval = setInterval(() => {
            fetchSongDetails(true); // silent poll
        }, 3000);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [songLyrics, fetchSongDetails]);

  return (
    <div className={`min-h-screen font-sans pb-[calc(4rem+env(safe-area-inset-bottom))] relative transition-colors duration-500 overflow-x-hidden ${isDark ? 'bg-[#0f172a]' : 'bg-[#F4EFE7]'}`}>

      {/* Sticky Header Toolbar */}
      <div className={`sticky top-[var(--navbar-height)] z-40 backdrop-blur-md border-b shadow-sm transition-colors duration-500 pt-1 pb-2 md:py-3 ${isDark ? 'bg-[#1e293b]/95 border-gray-700/50' : 'bg-white/95 border-[#E8DCCB]'}`}>
        
        {/* Desktop & Tablet Layout (>= 768px) */}
        <div className="hidden md:flex max-w-[960px] w-[92%] lg:w-full mx-auto items-center justify-between gap-4">
          {/* Left: Back */}
          <div className="w-[100px] flex shrink-0">
            <Link to="/songs" className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all min-h-[44px] ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600 hover:bg-gray-700' : 'bg-[#F4EFE7] text-[#54091b] border-[#54091b]/10 hover:border-[#54091b]/30 hover:bg-white'}`}>
              <ChevronLeft size={16} /> <span>{t("Back")}</span>
            </Link>
          </div>

          {/* Center: Title + Zoom */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5">
             <div className={`text-lg lg:text-xl font-black truncate w-full text-center ${isDark ? 'text-white' : 'text-[#54091b]'}`}>
               {songMeta.titleTamil || songMeta.title}
             </div>
             
             <div className={`flex items-center gap-1 p-0.5 rounded-full border transition-colors ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#F4EFE7] border-[#54091b]/10'}`}>
                <button onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))} className={`p-1.5 rounded-full transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-white text-[#54091b]/70 hover:text-[#54091b]'}`} title={t("Decrease Font")}><ZoomOut size={14} /></button>
                <span className={`text-xs font-bold w-10 text-center select-none ${isDark ? 'text-gray-300' : 'text-[#54091b]'}`}>{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))} className={`p-1.5 rounded-full transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-white text-[#54091b]/70 hover:text-[#54091b]'}`} title={t("Increase Font")}><ZoomIn size={14} /></button>
             </div>
          </div>

          {/* Right: Search & Theme */}
          <div className="w-[320px] flex shrink-0 items-center gap-2 justify-end">
             <div className="flex-1 min-w-0">
               <SongInlineSearch />
             </div>
             <button onClick={toggleTheme} className={`p-2.5 rounded-xl border-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center ${isDark ? 'border-gray-700 bg-gray-800 text-yellow-400 hover:border-gray-600' : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] hover:border-[#54091b]/30'}`} title={t("Toggle Theme")}>
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
             </button>
          </div>
        </div>

        {/* Mobile Layout (< 768px) */}
        <div className="flex md:hidden flex-col w-full px-4 gap-3">
          {/* Row 1: Back + Title */}
          <div className="flex items-center gap-3">
             <Link to="/songs" className={`flex items-center justify-center p-2.5 rounded-xl border transition-all min-h-[44px] min-w-[44px] shrink-0 ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-[#F4EFE7] text-[#54091b] border-[#54091b]/10'}`}>
               <ChevronLeft size={20} />
             </Link>
             <div className={`text-base font-black truncate flex-1 ${isDark ? 'text-white' : 'text-[#54091b]'}`}>
               {songMeta.titleTamil || songMeta.title}
             </div>
          </div>

          {/* Row 2: Search + Theme */}
          <div className="flex items-center gap-2">
             <div className="flex-1 min-w-0">
               <SongInlineSearch />
             </div>
             <button onClick={toggleTheme} className={`p-2.5 rounded-xl border-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center ${isDark ? 'border-gray-700 bg-gray-800 text-yellow-400' : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b]'}`}>
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
             </button>
          </div>

          {/* Row 3: Zoom Controls */}
          <div className="flex justify-center">
             <div className={`flex items-center justify-between gap-1 p-1 rounded-full border w-full max-w-[200px] transition-colors ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#F4EFE7] border-[#54091b]/10'}`}>
                <button onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))} className={`p-2 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-white text-[#54091b]/70 hover:text-[#54091b]'}`}><ZoomOut size={16} /></button>
                <span className={`text-sm font-bold w-12 text-center select-none ${isDark ? 'text-gray-300' : 'text-[#54091b]'}`}>{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))} className={`p-2 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-white text-[#54091b]/70 hover:text-[#54091b]'}`}><ZoomIn size={16} /></button>
             </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-[92%] lg:max-w-[960px] mx-auto px-4 sm:px-0 pt-2 sm:pt-6">

        {/* Metadata Area (Compact Tags) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4 animate-fade-in-up">
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-colors ${isDark ? 'bg-gray-800 text-[#D4AF37] border border-gray-700' : 'bg-[#54091b] text-[#F6EFE3]'}`}>{songMeta.category}</span>
          {songMeta.artist && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>🎤 {songMeta.artist}</span>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-[#1E293B] border-[#E8DCCB]'}`}>{songMeta.language}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border border-dashed transition-colors ${isDark ? 'bg-gray-800/50 text-gray-400 border-gray-700' : 'bg-[#F8F4EC] text-slate-500 border-[#E8DCCB]'}`}>Source: {songMeta.source}</span>
        </div>

        {loading ? (
          /* Premium Skeleton Loader */
          <div className={`rounded-[18px] sm:rounded-[32px] p-8 sm:p-12 shadow-sm border animate-pulse transition-colors duration-500 ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-[#E8DCCB]'}`}>
            <div className="space-y-6 max-w-md mx-auto text-center">
              <div className={`h-4 rounded-full w-3/4 mx-auto ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`}></div>
              <div className={`h-4 rounded-full w-2/4 mx-auto ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}></div>
              <div className={`h-4 rounded-full w-3/4 mx-auto ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`}></div>
              <div className={`h-4 rounded-full w-1/2 mx-auto ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}></div>
            </div>
          </div>
        ) : error || !songLyrics ? (
          /* Error State */
          <div className={`rounded-[18px] sm:rounded-[32px] shadow-sm border p-8 sm:p-12 text-center animate-fade-in-up transition-colors duration-500 ${isDark ? 'bg-[#1e293b] border-red-900/30' : 'bg-white border-red-100'}`}>
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t(error || "Song details not found")}</h2>
            <div className="flex justify-center gap-4 mt-6 sm:mt-8">
              <button
                onClick={() => fetchSongDetails(false)}
                className={`inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all hover:-translate-y-1 shadow-md min-h-[44px] ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' : 'bg-[#54091b] text-white hover:bg-[#7a0f29]'}`}
              >
                <RefreshCw size={18} /> {t("Retry")}
              </button>
            </div>
          </div>
        ) : songLyrics === "pending_fetch" || songLyrics === "pending" ? (
          /* Pending Fetch State */
          <div className={`rounded-[18px] sm:rounded-[32px] shadow-sm border p-8 sm:p-12 text-center animate-fade-in-up transition-colors duration-500 ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-[#E8DCCB]'}`}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-6">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-[#54091b]"></div>
            </div>
            <h2 className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {t("This song has been discovered and is awaiting verified lyrics.")}
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {t("Fetching verified lyrics... Please wait.")}
            </p>
          </div>
        ) : songLyrics === "unavailable" ? (
          /* Unavailable State */
          <div className={`rounded-[18px] sm:rounded-[32px] shadow-sm border p-8 sm:p-12 text-center animate-fade-in-up transition-colors duration-500 ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-[#E8DCCB]'}`}>
            <div className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-6 rounded-full ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7]'}`}>
              <AlertCircle size={32} className="text-[#54091b]" />
            </div>
            <h2 className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {t("Verified lyrics are not yet available.")}
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {t("We have discovered this song but could not extract verified lyrics at this time.")}
            </p>
          </div>
        ) : (
          /* Content Container */
          <div className={`rounded-[18px] sm:rounded-[32px] p-5 sm:p-12 shadow-sm border animate-fade-in-up transition-colors duration-500 overflow-hidden w-full ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-[#E8DCCB]'}`}>
            
            {/* Tabs (If dual language available) */}
            {songMeta.lyricsEnglish && (
              <div className="flex justify-center mb-6 overflow-x-auto">
                 <div className={`p-1 rounded-2xl inline-flex shadow-inner transition-colors max-w-full ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7]'}`}>
                    <button 
                       onClick={() => setActiveTab('tamil')}
                       className={`px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base whitespace-nowrap min-h-[44px] ${activeTab === 'tamil' ? (isDark ? 'bg-gray-700 text-[#D4AF37] shadow-sm' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-700')}`}
                    >
                       Tamil Lyrics
                    </button>
                    <button 
                       onClick={() => setActiveTab('english')}
                       className={`px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base whitespace-nowrap min-h-[44px] ${activeTab === 'english' ? (isDark ? 'bg-gray-700 text-[#D4AF37] shadow-sm' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-700')}`}
                    >
                       English Transliteration
                    </button>
                 </div>
              </div>
            )}

            {/* Lyrics Area */}
            <div className="w-full text-center mx-auto transition-all duration-300 ease-out overflow-x-hidden" style={{ fontSize: `${zoomLevel}%` }}>
              {activeTab === 'tamil' && songSections && songSections.length > 0 ? (
                <div className={`font-medium text-[1.375em] lg:text-[1.875em] leading-[1.9] lg:leading-[2.0] whitespace-pre-wrap break-words [overflow-wrap:anywhere] font-serif tracking-[0.01em] transition-colors ${isDark ? 'text-gray-300' : 'text-[#1E293B]'}`}>
                  {songSections.map((section, idx) => (
                    <div key={idx} className="mb-[2em] animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                      {(section.label || section.type) && (
                         <div className={`text-[0.6em] lg:text-[0.55em] font-bold mb-[1em] uppercase tracking-wider ${isDark ? 'text-[#D4AF37]' : 'text-[#54091b]'}`}>
                           {section.label || `${section.type} ${section.number || ''}`.trim()}
                         </div>
                      )}
                      <div>
                        {(section.lines || []).map((line, lIdx) => (
                          <div key={lIdx} className="min-h-[1.5em]">{line}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`font-medium ${activeTab === 'tamil' ? 'text-[1.375em] lg:text-[1.875em] leading-[1.9] lg:leading-[2.0]' : 'text-[1.125em] lg:text-[1.375em] leading-[1.8] lg:leading-[1.9]'} whitespace-pre-wrap break-words [overflow-wrap:anywhere] font-serif tracking-[0.01em] transition-colors ${isDark ? 'text-gray-300' : 'text-[#1E293B]'}`}
                  dangerouslySetInnerHTML={{ __html: (activeTab === 'english' && songMeta.lyricsEnglish) ? songMeta.lyricsEnglish : (songMeta.lyricsTamil || songLyrics) }}
                ></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
