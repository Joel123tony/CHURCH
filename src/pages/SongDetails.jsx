import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { ChevronLeft, Music, AlertCircle, RefreshCw, ZoomIn, ZoomOut, RotateCcw, Moon, Sun } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTab, setActiveTab] = useState('tamil');

  // The state from the Link if available
  const songMeta = location.state?.song || {
    title: t("Song Details"),
    category: t("Unknown"),
    source: t("Unknown"),
    language: "Tamil"
  };

  const fetchSongDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      if (songMeta.lyricsTamil) {
         setSongLyrics(songMeta.lyricsTamil); // We already have the text
         setLoading(false);
         return;
      }
      
      const res = await API.get(`/songs/details?url=${encodeURIComponent(decodeURIComponent(id))}&title=${encodeURIComponent(songMeta.title || songMeta.titleTamil)}`);
      if (res.data.success && res.data.data) {
        setSongLyrics(res.data.data.lyrics);
      } else {
        setError("Song lyrics not found");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongDetails();
  }, [id]);

  return (
    <div className={`min-h-screen font-sans pb-24 relative transition-colors duration-500 ${isDark ? 'bg-[#0f172a]' : 'bg-[#F4EFE7]'}`}>

      {/* Sticky Header Toolbar */}
      <div className={`sticky top-[var(--navbar-height)] z-40 backdrop-blur-md border-b shadow-sm transition-colors duration-500 ${isDark ? 'bg-[#1e293b]/95 border-gray-700/50' : 'bg-white/95 border-[#E8DCCB]'}`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          
          <div className="flex w-full md:w-auto items-center justify-start shrink-0">
            <Link
              to="/songs"
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all shadow-sm shrink-0 ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600 hover:bg-gray-700' : 'bg-[#F4EFE7] text-[#54091b] border-[#54091b]/10 hover:border-[#54091b]/30 hover:bg-white'}`}
            >
              <ChevronLeft size={16} />
              <span>{t("Back")}</span>
            </Link>
          </div>

          <div className="flex-1 w-full text-center flex flex-col justify-center truncate px-2">
            {songMeta.titleEnglish && (
               <div className={`text-sm md:text-base font-bold truncate transition-colors ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{songMeta.titleEnglish}</div>
            )}
            <div className={`text-base md:text-lg font-black truncate transition-colors ${isDark ? 'text-white' : 'text-[#54091b]'}`}>{songMeta.titleTamil || songMeta.title}</div>
          </div>

          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 shrink-0">
            <div className="flex-1 max-w-[320px]">
              <SongInlineSearch />
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-colors border-2 shrink-0 ${isDark ? 'border-gray-700 bg-gray-800 text-yellow-400 hover:border-gray-600' : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] hover:border-[#54091b]/30'}`}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">

        {/* Metadata Area (Tags + Tools) */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 animate-fade-in-up p-4 rounded-[20px] border shadow-sm transition-colors duration-500 ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-[#E8DCCB]'}`}>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-colors ${isDark ? 'bg-gray-800 text-[#D4AF37] border border-gray-700' : 'bg-[#54091b] text-[#F6EFE3]'}`}>{songMeta.category}</span>
            {songMeta.artist && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>🎤 {songMeta.artist}</span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-[#1E293B] border-[#E8DCCB]'}`}>{songMeta.language}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border border-dashed transition-colors ${isDark ? 'bg-gray-800/50 text-gray-400 border-gray-700' : 'bg-[#F8F4EC] text-slate-500 border-[#E8DCCB]'}`}>Source: {songMeta.source}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 p-1 rounded-xl border shrink-0 transition-colors ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#F4EFE7] border-[#54091b]/10'}`}>
              <button onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-white text-[#54091b]/70 hover:text-[#54091b]'}`} title={t("Decrease Font")}><ZoomOut size={16} /></button>
              <span className={`text-xs font-bold w-9 text-center select-none ${isDark ? 'text-gray-300' : 'text-[#54091b]'}`}>{zoomLevel}%</span>
              <button onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-white text-[#54091b]/70 hover:text-[#54091b]'}`} title={t("Increase Font")}><ZoomIn size={16} /></button>
              <div className={`w-px h-4 mx-0.5 ${isDark ? 'bg-gray-700' : 'bg-[#54091b]/20'}`}></div>
              <button onClick={() => setZoomLevel(100)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-white text-[#54091b]/70 hover:text-[#54091b]'}`} title={t("Reset Font")}><RotateCcw size={14} /></button>
            </div>
          </div>
        </div>

        {loading ? (
          /* Premium Skeleton Loader */
          <div className={`rounded-3xl p-8 sm:p-12 shadow-sm border animate-pulse transition-colors duration-500 ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-[#E8DCCB]'}`}>
            <div className="space-y-6 max-w-md mx-auto text-center">
              <div className={`h-4 rounded-full w-3/4 mx-auto ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`}></div>
              <div className={`h-4 rounded-full w-2/4 mx-auto ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}></div>
              <div className={`h-4 rounded-full w-3/4 mx-auto ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`}></div>
              <div className={`h-4 rounded-full w-1/2 mx-auto ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}></div>
              <div className={`h-4 rounded-full w-3/4 mx-auto mt-10 ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`}></div>
              <div className={`h-4 rounded-full w-2/4 mx-auto ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}></div>
            </div>
          </div>
        ) : error || !songLyrics ? (
          /* Error State */
          <div className={`rounded-[24px] shadow-sm border p-12 text-center animate-fade-in-up transition-colors duration-500 ${isDark ? 'bg-[#1e293b] border-red-900/30' : 'bg-white border-red-100'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t(error || "Song details not found")}</h2>
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={fetchSongDetails}
                className={`inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all hover:-translate-y-1 shadow-md ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' : 'bg-[#54091b] text-white hover:bg-[#7a0f29]'}`}
              >
                <RefreshCw size={18} /> {t("Retry")}
              </button>
            </div>
          </div>
        ) : (
          /* Content Container */
          <div className={`rounded-[32px] p-6 sm:p-12 shadow-sm border animate-fade-in-up transition-colors duration-500 ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-[#E8DCCB]'}`}>
            
            {/* Tabs (If dual language available) */}
            {songMeta.lyricsEnglish && (
              <div className="flex justify-center mb-8">
                 <div className={`p-1.5 rounded-2xl inline-flex shadow-inner transition-colors ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7]'}`}>
                    <button 
                       onClick={() => setActiveTab('tamil')}
                       className={`px-8 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'tamil' ? (isDark ? 'bg-gray-700 text-[#D4AF37] shadow-sm' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-700')}`}
                    >
                       Tamil Lyrics
                    </button>
                    <button 
                       onClick={() => setActiveTab('english')}
                       className={`px-8 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'english' ? (isDark ? 'bg-gray-700 text-[#D4AF37] shadow-sm' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-700')}`}
                    >
                       English Transliteration
                    </button>
                 </div>
              </div>
            )}

            {/* Lyrics Area */}
            <div className="prose prose-lg max-w-none text-center mx-auto transition-all duration-300 ease-out" style={{ fontSize: `${1.125 * (zoomLevel / 100)}rem` }}>
              <div
                className={`font-medium leading-[2.5] whitespace-pre-wrap font-serif tracking-wide transition-colors ${isDark ? 'text-gray-300' : 'text-[#1E293B]'}`}
                dangerouslySetInnerHTML={{ __html: (activeTab === 'english' && songMeta.lyricsEnglish) ? songMeta.lyricsEnglish : (songMeta.lyricsTamil || songLyrics) }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
