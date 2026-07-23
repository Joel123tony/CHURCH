import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import API from "../api/axios";

const LanguageContext = createContext(null);

// ─── localStorage cache helpers ────────────────────────────────────
const CACHE_KEY = "mtc-translations";
const CACHE_VERSION = 2;

function loadCachedTranslations() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed?.v !== CACHE_VERSION) return {};
    return parsed.data || {};
  } catch {
    return {};
  }
}

function saveCachedTranslations(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ v: CACHE_VERSION, data }));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

// ─── Provider ──────────────────────────────────────────────────────
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("site-language");
    return saved === "ta" ? "ta" : "en";
  });

  const [translationCache, setTranslationCache] = useState(() => loadCachedTranslations());
  
  // Dynamic queue for strings that need translation
  const pendingQueue = useRef(new Set());
  const translateTimer = useRef(null);

  // Persist language preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("site-language", language);
    document.documentElement.lang = language;
  }, [language]);

  // ── Flush the pending translation queue ─────────────────────────
  const flushPendingTranslations = useCallback(async () => {
    const queue = Array.from(pendingQueue.current);
    if (queue.length === 0) return;
    
    // Clear the queue immediately so we don't double-fetch
    pendingQueue.current.clear();

    try {
      const res = await API.post("/translate", {
        texts: queue,
        targetLang: "ta",
      });

      const translations = res?.data?.translations || [];

      // Update cache using functional state to ensure we have latest state
      setTranslationCache((prev) => {
        const next = { ...prev };
        let changed = false;
        for (let i = 0; i < queue.length; i++) {
          // Cache the result or fallback to English to prevent infinite refetch loops
          const trans = translations[i] || queue[i];
          if (next[queue[i]] !== trans) {
            next[queue[i]] = trans;
            changed = true;
          }
        }
        if (changed) saveCachedTranslations(next);
        return changed ? next : prev;
      });
    } catch (err) {
      console.error("Dynamic translation failed:", err);
    }
  }, []);

  // ── The t() function ──────────────────────────────────────────
  const value = useMemo(() => {
    const t = (key) => {
      if (!key) return "";

      const enText = key;

      // If language is English, return as-is
      if (language === "en") return enText;

      const STATIC_DICTIONARY = {
        "Holy Life": "பரிசுத்த ஜீவியம்",
        "Gospel Ministry": "சுவிசேஷ ஊழியம்",
        "Holy Life , Gospel Ministry": "பரிசுத்த ஜீவியம் , சுவிசேஷ ஊழியம்",
        "Gallery": "கேலரி",
        "Pastor": "பாஸ்டர்",
        "Pastor's Message": "பாஸ்டரின் செய்தி",
        "Contact Us": "எங்களை தொடர்புகொள்ளுங்கள்",
        "youtube": "யூடியூப்",
        "youtube.loading": "ஏற்றுகிறது...",
        "youtube.noVideos": "வீடியோக்கள் இல்லை",
        "Search Christan Songs": "கிறிஸ்தவ பாடல்களைத் தேடுங்கள்",
        "Search songs by title or lyrics...": "தலைப்பு அல்லது பாடல்வரிகளைத் தேடுங்கள்..."
      };

      if (STATIC_DICTIONARY[enText]) {
        return STATIC_DICTIONARY[enText];
      }

      // Language is Tamil
      if (typeof enText === "string" && enText.trim()) {
        if (translationCache[enText]) {
          return translationCache[enText];
        } else {
          // Add to pending queue if not already queued
          if (!pendingQueue.current.has(enText)) {
            pendingQueue.current.add(enText);
            
            // Debounce flush
            if (translateTimer.current) clearTimeout(translateTimer.current);
            translateTimer.current = setTimeout(() => {
              flushPendingTranslations();
            }, 300);
          }
        }
      }

      // Not yet translated — return English text (graceful fallback)
      return enText;
    };

    return {
      language,
      setLanguage,
      toggleLanguage: () =>
        setLanguage((current) => (current === "en" ? "ta" : "en")),
      t,
    };
  }, [language, translationCache, flushPendingTranslations]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
