import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("mtc-reading-theme");
      return saved === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("mtc-reading-theme", isDarkMode ? "dark" : "light");
    } catch {
      // Ignore storage failures in private browsing or restricted environments.
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
