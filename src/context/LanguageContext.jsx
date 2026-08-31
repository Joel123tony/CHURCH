import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "../data/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("site-language");
    return saved === "ta" ? "ta" : "en";
  });

  // Persist language preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("site-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const t = (key) => {
      if (!key) return "";
      
      // If language is English, return the English translation or fallback to key
      if (language === "en") {
        return translations.en[key] || key;
      }

      // If language is Tamil, return the Tamil translation or fallback to English, then key
      if (language === "ta") {
        return translations.ta[key] || translations.en[key] || key;
      }

      return key;
    };

    return {
      language,
      setLanguage,
      toggleLanguage: () =>
        setLanguage((current) => (current === "en" ? "ta" : "en")),
      t,
    };
  }, [language]);

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
