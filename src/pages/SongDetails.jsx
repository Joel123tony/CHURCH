import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { ChevronLeft, Music, AlertCircle, RefreshCw, ZoomIn, ZoomOut, RotateCcw, Share2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import API from "../api/axios";

export default function SongDetails() {
  const { id } = useParams();
  const location = useLocation();
  const { t } = useLanguage();

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: songMeta.title,
        url: decodeURIComponent(id)
      }).catch(err => console.error(err));
    } else {
      navigator.clipboard.writeText(decodeURIComponent(id));
      alert(t("Link copied to clipboard!"));
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EFE7] font-sans pb-24 relative">

      {/* Sticky Header Toolbar */}
      <div className="sticky top-[var(--navbar-height)] z-40 bg-white/90 backdrop-blur-md border-b border-[#E8DCCB] shadow-sm transition-colors duration-500">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

          <Link
            to="/songs"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-[#F4EFE7] text-[#54091b] border border-[#54091b]/10 hover:border-[#54091b]/30 hover:bg-white transition-all shadow-sm shrink-0"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">{t("Back")}</span>
          </Link>

          <div className="flex-1 text-center truncate px-2">
            <h2 className="text-base sm:text-lg font-bold text-[#54091b] truncate">{songMeta.title}</h2>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F4EFE7] border border-[#54091b]/10 shrink-0">
            <button
              onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))}
              className="p-2 rounded-lg hover:bg-white text-[#54091b]/70 hover:text-[#54091b] hover:shadow-sm transition-all"
              title={t("Decrease Font")}
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-bold w-10 text-center select-none text-[#54091b]">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))}
              className="p-2 rounded-lg hover:bg-white text-[#54091b]/70 hover:text-[#54091b] hover:shadow-sm transition-all"
              title={t("Increase Font")}
            >
              <ZoomIn size={16} />
            </button>
            <div className="w-px h-5 mx-0.5 bg-[#54091b]/20"></div>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-2 rounded-lg hover:bg-white text-[#54091b]/70 hover:text-[#54091b] hover:shadow-sm transition-all"
              title={t("Reset Font")}
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <button
            onClick={handleShare}
            className="hidden sm:flex items-center justify-center p-2.5 rounded-xl bg-[#F4EFE7] text-[#54091b] border border-[#54091b]/10 hover:border-[#54091b]/30 hover:bg-white transition-all shadow-sm shrink-0"
            title={t("Share")}
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">

        {/* Title Area */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm border border-[#E8DCCB] mb-6">
            <Music size={28} className="text-[#D4AF37]" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#54091b] tracking-tight mb-2">{songMeta.titleTamil || songMeta.title}</h1>
          {songMeta.titleEnglish && (
             <h2 className="text-xl sm:text-2xl font-bold text-slate-500 tracking-tight mb-4">{songMeta.titleEnglish}</h2>
          )}
          {songMeta.artist && (
             <h3 className="text-lg font-semibold text-slate-600 mb-2">🎤 {songMeta.artist}</h3>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#54091b] text-[#F6EFE3] shadow-sm">{songMeta.category}</span>
            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-[#1E293B] border border-[#E8DCCB]">{songMeta.language}</span>
            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#F8F4EC] text-slate-500 border border-[#E8DCCB] border-dashed">Source: {songMeta.source}</span>
          </div>
          <div className="h-1 w-20 bg-[#D4AF37] mx-auto mt-8 rounded-full opacity-60"></div>
        </div>

        {loading ? (
          /* Premium Skeleton Loader */
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-[#E8DCCB] animate-pulse">
            <div className="space-y-6 max-w-md mx-auto text-center">
              <div className="h-4 bg-slate-200 rounded-full w-3/4 mx-auto"></div>
              <div className="h-4 bg-slate-100 rounded-full w-2/4 mx-auto"></div>
              <div className="h-4 bg-slate-200 rounded-full w-3/4 mx-auto"></div>
              <div className="h-4 bg-slate-100 rounded-full w-1/2 mx-auto"></div>
              <div className="h-4 bg-slate-200 rounded-full w-3/4 mx-auto mt-10"></div>
              <div className="h-4 bg-slate-100 rounded-full w-2/4 mx-auto"></div>
            </div>
          </div>
        ) : error || !songLyrics ? (
          /* Error State */
          <div className="bg-white rounded-[24px] shadow-sm border border-red-100 p-12 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t(error || "Song details not found")}</h2>
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={fetchSongDetails}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#54091b] text-white font-bold rounded-xl hover:bg-[#7a0f29] transition-all hover:-translate-y-1 shadow-md"
              >
                <RefreshCw size={18} /> {t("Retry")}
              </button>
            </div>
          </div>
        ) : (
          /* Content Container */
          <div className="bg-white rounded-[32px] p-6 sm:p-12 shadow-sm border border-[#E8DCCB] animate-fade-in-up">
            
            {/* Tabs (If dual language available) */}
            {songMeta.lyricsEnglish && (
              <div className="flex justify-center mb-8">
                 <div className="bg-[#F4EFE7] p-1.5 rounded-2xl inline-flex shadow-inner">
                    <button 
                       onClick={() => setActiveTab('tamil')}
                       className={`px-8 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'tamil' ? 'bg-white text-[#54091b] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       Tamil Lyrics
                    </button>
                    <button 
                       onClick={() => setActiveTab('english')}
                       className={`px-8 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'english' ? 'bg-white text-[#54091b] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       English Transliteration
                    </button>
                 </div>
              </div>
            )}

            {/* Lyrics Area */}
            <div className="prose prose-lg max-w-none text-center mx-auto transition-all duration-300 ease-out" style={{ fontSize: `${1.125 * (zoomLevel / 100)}rem` }}>
              <div
                className="font-medium text-[#1E293B] leading-[2.5] whitespace-pre-wrap font-serif tracking-wide"
                dangerouslySetInnerHTML={{ __html: (activeTab === 'english' && songMeta.lyricsEnglish) ? songMeta.lyricsEnglish : (songMeta.lyricsTamil || songLyrics) }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
