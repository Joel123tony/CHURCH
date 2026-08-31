import React, { useState, useEffect, useRef } from "react";
import { bibleVerses } from "../data/bibleVerses";
import { useScrollLock } from "../hooks/useScrollLock";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../data/translations";
import { X, Download, Loader2 } from "lucide-react";
import bibleLogo from "../assets/bible-logo.png";
import { renderVerseCanvas } from "../utils/canvasRenderer";

export default function BibleBlessingModal() {
  const [isVisible, setIsVisible] = useState(false);
  
  // Lock background scroll purely via JS events (no layout mutation)
  useScrollLock(isVisible);
  
  const [isClosing, setIsClosing] = useState(false);
  const [verse, setVerse] = useState(null);
  const { language } = useLanguage();
  const [popupLanguage, setPopupLanguage] = useState("en");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const modalRef = useRef(null);

  // Initialize popup language when language is available
  useEffect(() => {
    if (language && !isVisible) {
      setPopupLanguage(language);
    }
  }, [language, isVisible]);

  const t = (key) => {
    if (!key) return "";
    if (popupLanguage === "en") return translations.en[key] || key;
    if (popupLanguage === "ta") return translations.ta[key] || translations.en[key] || key;
    return key;
  };

  // Inject Google Fonts dynamically so canvas can use them
  useEffect(() => {
    if (isVisible) {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wght@400;700&family=Playfair+Display:wght@400;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [isVisible]);

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
        const tryShow = () => {
          setIsVisible(true);
          sessionStorage.setItem("bibleBlessingShown", "true");
        };

        const isHomePage = window.location.pathname === '/';
        
        if (isHomePage) {
          if (window.initialHomepageDataReady) {
            tryShow();
          } else {
            window.addEventListener("homepageDataReady", tryShow, { once: true });
          }
        } else {
          tryShow();
        }
      }, 1000); // 1 second delay
    };

    const handleLoad = () => {
      // Use requestIdleCallback if available to wait for browser to be idle
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => startTimer(), { timeout: 1000 });
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
    if (!verse) return;
    setIsGeneratingImage(true);

    try {
      const currentVerse = verse[popupLanguage];
      const theme = {
        bg: { type: 'solid', color: '#F8F3EC' },
        textColor: '#5D1324',
        accentColor: '#D7C9B5',
      };

      const fontFamily = popupLanguage === 'en' ? "'Playfair Display', serif" : "'Noto Serif Tamil', serif";

      const { dataUrl } = await renderVerseCanvas({
        width: 1080,
        height: 1350, // 4:5 Instagram Portrait ratio
        theme,
        fontFamily,
        fontSize: 48,
        fontColor: theme.textColor,
        textAlign: 'center',
        bookLocalized: currentVerse.book,
        chapter: currentVerse.chapter,
        verseNum: currentVerse.verse,
        text: currentVerse.text,
        language: popupLanguage,
        isMultiple: false
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Bible-Blessing-${popupLanguage}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!isVisible || !verse) return null;

  const currentVerse = verse[popupLanguage];

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
              {t("Today's Bible Blessing")}
            </h2>
            <div className="w-16 h-1 bg-[#5D1324]/30 mt-4 rounded-full mx-auto" />
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-[#D7C9B5]/30 p-1 rounded-lg mb-6">
            <button
              onClick={() => setPopupLanguage("en")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${popupLanguage === "en"
                  ? "bg-[#5D1324] text-white shadow-sm"
                  : "text-[#5D1324] hover:bg-[#5D1324]/10"
                }`}
            >
              English
            </button>
            <button
              onClick={() => setPopupLanguage("ta")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${popupLanguage === "ta"
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
              <div className="inline-grid min-h-10 place-items-center rounded-full border border-[#5D1324]/10 bg-[#5D1324]/5 px-6 py-1.5">
                <span className="block -translate-y-0.5 text-center text-sm font-semibold leading-[1.35] text-[#5D1324] sm:text-base">
                  {currentVerse.book} {currentVerse.chapter}:{currentVerse.verse}
                </span>
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
            {t("Save Blessing")}
          </button>
        </div>
      </div>
    </div>
  );
}
