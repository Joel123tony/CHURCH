import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getBlock } from "../services/api";
import API from "../api/axios";

const LanguageContext = createContext(null);



// ─── localStorage cache helpers ────────────────────────────────────
const CACHE_KEY = "mtc-translations";
const CACHE_VERSION = 1;

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

  const [cmsData, setCmsData] = useState({});
  const [previewData, setPreviewData] = useState({});

  const [translationCache, setTranslationCache] = useState(() => loadCachedTranslations());
  const [translating, setTranslating] = useState(false);
  
  // Dynamic queue for strings that need translation
  const pendingQueue = useRef(new Set());
  const translateTimer = useRef(null);

  // Persist language preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("site-language", language);
    document.documentElement.lang = language;
  }, [language]);

  // ── Load CMS blocks ───────────────────────────────────────────
  useEffect(() => {
    const loadCms = async () => {
      try {
        const sections = ["hero", "history", "contact", "footer"];
        const loaded = {};
        for (const sec of sections) {
          try {
            const res = await getBlock(sec);
            if (res && res.data) {
              const data = res.data;
              if (sec === "hero") {
                if (data.heading) loaded["hero.heading"] = data.heading;
                if (data.subheading) loaded["hero.description"] = data.subheading;
              } else if (sec === "history") {
                if (data.title) loaded["history.title"] = data.title;
                if (data.content) loaded["history.content"] = data.content;
                if (data.imageUrl) loaded["history.image"] = data.imageUrl;
              } else if (sec === "contact") {
                if (data.email) loaded["contact.emailUs"] = data.email;
                if (data.phone) loaded["contact.phone"] = data.phone;
                if (data.description) loaded["contact.description"] = data.description;
              } else if (sec === "footer") {
                if (data.copyright) loaded["footer.copyright"] = data.copyright;
              }
            }
          } catch (e) {
            console.warn(`CMS key ${sec} could not be loaded`, e);
          }
        }
        setCmsData(loaded);
      } catch (err) {
        console.error("Error loading initial CMS data", err);
      }
    };
    loadCms();
  }, []);



  // ── Flush the pending translation queue ─────────────────────────
  const flushPendingTranslations = useCallback(async () => {
    const queue = Array.from(pendingQueue.current);
    if (queue.length === 0) return;
    
    // Clear the queue immediately so we don't double-fetch
    pendingQueue.current.clear();
    setTranslating(true);

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
          if (translations[i] && translations[i] !== queue[i] && next[queue[i]] !== translations[i]) {
            next[queue[i]] = translations[i];
            changed = true;
          }
        }
        if (changed) saveCachedTranslations(next);
        return changed ? next : prev;
      });
    } catch (err) {
      console.error("Dynamic translation failed:", err);
    } finally {
      setTranslating(false);
    }
  }, []);

  // ── The t() function ──────────────────────────────────────────
  const value = useMemo(() => {
    const t = (key) => {
      if (!key) return "";

      // Resolve the English source text
      const enText = (() => {
        // 1. Preview overrides
        if (previewData?.[key] !== undefined && previewData[key] !== "") {
          return previewData[key];
        }
        // 2. CMS data
        if (cmsData?.[key] !== undefined && cmsData[key] !== "") {
          return cmsData[key];
        }

        // 3. Literal string fallback (no dictionaries)
        return key; 
      })();

      // If language is English, return as-is
      if (language === "en") return enText;

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
      translating,
      previewData,
      setPreviewData,
      cmsData,
      setCmsData,
    };
  }, [language, previewData, cmsData, translationCache, translating, flushPendingTranslations]);

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
