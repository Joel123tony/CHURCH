import React, { useState, useEffect, useRef } from "react";
import { bibleVerses } from "../data/bibleVerses";
import { useScrollLock } from "../hooks/useScrollLock";
import { X, Download, Loader2 } from "lucide-react";
import bibleLogo from "../assets/bible-logo.png";

export default function BibleBlessingModal() {
  const [isVisible, setIsVisible] = useState(false);
  
  // Lock background scroll purely via JS events (no layout mutation)
  useScrollLock(isVisible);
  
  const [isClosing, setIsClosing] = useState(false);
  const [verse, setVerse] = useState(null);
  const [language, setLanguage] = useState("en"); // "en" or "ta"
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const modalRef = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    // Check if it has already been shown in this session
    const hasShown = sessionStorage.getItem("bibleBlessingShown");
    if (hasShown) return;

    const lastId = localStorage.getItem("lastBibleBlessingId");

    // Pick a random verse that is not the same as the last one
    let randomVerse;
    do {
      randomVerse = bibleVerses[Math.floor(Math.random() * bibleVerses.length)];
    } while (lastId && randomVerse.id.toString() === lastId && bibleVerses.length > 1);

    localStorage.setItem("lastBibleBlessingId", randomVerse.id.toString());
    setVerse(randomVerse);

    const startTimer = () => {
      setTimeout(() => {
        setIsVisible(true);
        sessionStorage.setItem("bibleBlessingShown", "true");
      }, 2000); // 2 second delay after idle
    };

    const handleLoad = () => {
      // Use requestIdleCallback if available to wait for browser to be idle
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => startTimer(), { timeout: 2000 });
      } else {
        startTimer();
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isVisible) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 350); // wait for fadeOut animation to finish
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleClose();
    }
  };

  const handleSaveImage = async () => {
    if (!exportRef.current) return;
    setIsGeneratingImage(true);

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(exportRef.current, {
        scale: 2, // High DPI for crisp text
        useCORS: true,
        backgroundColor: "#F4EFE7",
        width: 1080,
        height: 1350,
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `Bible-Blessing-${language}.png`;
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!isVisible || !verse) return null;

  const currentVerse = verse[language];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"
        }`}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-lg bg-[#F4EFE7] rounded-2xl shadow-2xl overflow-hidden border border-[#D7C9B5]/50 ring-1 ring-white/20 ${isClosing ? "animate-fadeOut" : "animate-popIn"
          }`}
      >
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#D7C9B5] via-[#5D1324] to-[#D7C9B5] opacity-80" />

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#5D1324]/60 hover:text-[#5D1324] transition-colors focus:outline-none focus:ring-2 focus:ring-[#5D1324]/50 rounded-full p-1 z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 flex flex-col items-center text-center">
          {/* Icon & Title */}
          <div className="mb-6 flex flex-col items-center w-full">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#5D1324]/10 mb-3 p-1.5 shadow-[inset_0_2px_4px_rgba(93,19,36,0.1)] border border-[#5D1324]/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/40 blur-md rounded-full group-hover:bg-white/60 transition-all duration-500" />
              <img
                src={bibleLogo}
                alt="Bible Logo"
                className="w-full h-full object-contain relative z-10 p-0.5 transition-transform duration-500"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#5D1324] tracking-wide text-center w-full">
              {language === "en" ? "Today's Bible Blessing" : "இன்றைய வேத ஆசீர்வாதம்"}
            </h2>
            <div className="w-16 h-1 bg-[#5D1324]/30 mt-4 rounded-full mx-auto" />
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-[#D7C9B5]/30 p-1 rounded-lg mb-6">
            <button
              onClick={() => setLanguage("en")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${language === "en"
                  ? "bg-[#5D1324] text-white shadow-sm"
                  : "text-[#5D1324] hover:bg-[#5D1324]/10"
                }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage("ta")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${language === "ta"
                  ? "bg-[#5D1324] text-white shadow-sm"
                  : "text-[#5D1324] hover:bg-[#5D1324]/10"
                }`}
            >
              தமிழ்
            </button>
          </div>

          {/* Verse Content */}
          <div className="relative w-full py-6 px-2 flex flex-col items-center justify-center">
            {/* Symmetrical quotation marks watermark */}
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-7xl text-[#D7C9B5]/40 font-serif leading-none select-none">
              &ldquo;
            </span>
            <p className="relative z-10 text-lg sm:text-xl text-gray-800 font-medium leading-relaxed mb-8 italic text-center w-full">
              "{currentVerse.text}"
            </p>
            <div className="flex justify-center w-full">
              <div className="inline-flex items-center justify-center bg-[#5D1324]/5 border border-[#5D1324]/10 rounded-full px-6 py-2">
                <p className="text-[#5D1324] font-semibold text-sm sm:text-base m-0 text-center">
                  {currentVerse.book} {currentVerse.chapter}:{currentVerse.verse}
                </p>
              </div>
            </div>
          </div>
          {/* Save Button */}
          <button
            onClick={handleSaveImage}
            disabled={isGeneratingImage}
            className="mt-6 flex items-center justify-center gap-2 px-6 py-2.5 bg-[#5D1324] text-white font-medium rounded-full hover:bg-[#7D2935] transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#5D1324]/50 disabled:opacity-70"
          >
            {isGeneratingImage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {language === "en" ? "Save Blessing" : "ஆசீர்வாதத்தை சேமிக்க"}
          </button>
        </div>
      </div>

      {/* Hidden Export Template - 1080x1350 (Instagram Portrait) */}
      <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          ref={exportRef}
          style={{ width: '1080px', height: '1350px' }}
          className="bg-[#F4EFE7] flex flex-col items-center justify-between relative p-20 border-[16px] border-[#D7C9B5]"
        >
          {/* Decorative Corner Accents */}
          <div className="absolute top-10 left-10 w-24 h-24 border-t-8 border-l-8 border-[#5D1324]/20" />
          <div className="absolute top-10 right-10 w-24 h-24 border-t-8 border-r-8 border-[#5D1324]/20" />
          <div className="absolute bottom-10 left-10 w-24 h-24 border-b-8 border-l-8 border-[#5D1324]/20" />
          <div className="absolute bottom-10 right-10 w-24 h-24 border-b-8 border-r-8 border-[#5D1324]/20" />

          {/* Logo & Header */}
          <div className="flex flex-col items-center mt-12 w-full">
            <div className="flex items-center justify-center w-40 h-40 rounded-full bg-[#5D1324]/10 mb-8 p-4 shadow-[inset_0_4px_8px_rgba(93,19,36,0.1)] border-2 border-[#5D1324]/10 relative">
              <img src={bibleLogo} alt="Bible Logo" className="w-full h-full object-contain p-0.5" crossOrigin="anonymous" />
            </div>
            <h2 className="text-[52px] font-bold text-[#5D1324] tracking-wider uppercase text-center w-full">
              {language === "en" ? "Today's Bible Blessing" : "இன்றைய வேத ஆசீர்வாதம்"}
            </h2>
            <div className="w-32 h-1.5 bg-[#5D1324]/30 mt-10 rounded-full mx-auto" />
          </div>

          {/* Verse */}
          <div className="relative w-full max-w-[850px] text-center my-auto flex flex-col items-center justify-center">
            {/* Quotation Marks Symmetrical */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 text-[200px] text-[#D7C9B5]/40 font-serif leading-none select-none">
              &ldquo;
            </div>
            <p className="relative z-10 text-[46px] text-gray-800 font-medium leading-[1.6] italic px-8 whitespace-pre-wrap break-words text-center">
              "{currentVerse.text}"
            </p>
          </div>

          {/* Reference Badge */}
          <div className="mb-auto mt-8 flex justify-center w-full">
            <div className="inline-block bg-[#5D1324]/5 border-2 border-[#5D1324]/10 rounded-full px-12 py-5">
              <p className="text-[#5D1324] font-bold text-3xl text-center m-0">
                {currentVerse.book} {currentVerse.chapter}:{currentVerse.verse}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full px-16 flex flex-col items-center mb-6">
            <div className="w-full h-px bg-[#5D1324]/20 mb-10" />
            <p className="text-[#5D1324]/80 font-medium text-2xl tracking-widest uppercase text-center">
              Methodist Tamil Church - Padikuppam
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
