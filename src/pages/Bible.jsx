import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import {
  ChevronLeft, ChevronRight, Search, Moon, Sun,
  ZoomIn, ZoomOut, BookOpen, Copy, Check, ChevronDown, Minus, Plus, RotateCcw
} from "lucide-react";

// Tamil Book Names Mapping
const tamilBookNames = {
  "Genesis": "ஆதியாகமம்", "Exodus": "யாத்திராகமம்", "Leviticus": "லேவியராகமம்", "Numbers": "எண்ணாகமம்", "Deuteronomy": "உபாகமம்", "Joshua": "யோசுவா", "Judges": "நியாயாதிபதிகள்", "Ruth": "ரூத்", "1 Samuel": "1 சாமுவேல்", "2 Samuel": "2 சாமுவேல்", "1 Kings": "1 இராஜாக்கள்", "2 Kings": "2 இராஜாக்கள்", "1 Chronicles": "1 நாளாகமம்", "2 Chronicles": "2 நாளாகமம்", "Ezra": "எஸ்றா", "Nehemiah": "நெகேமியா", "Esther": "எஸ்தர்", "Job": "யோபு", "Psalms": "சங்கீதம்", "Proverbs": "நீதிமொழிகள்", "Ecclesiastes": "பிரசங்கி", "Song of Solomon": "உன்னதப்பாட்டு", "Isaiah": "ஏசாயா", "Jeremiah": "எரேமியா", "Lamentations": "புலம்பல்", "Ezekiel": "எசேக்கியேல்", "Daniel": "தானியேல்", "Hosea": "ஓசியா", "Joel": "யோவேல்", "Amos": "ஆமோஸ்", "Obadiah": "ஒபதியா", "Jonah": "யோனா", "Micah": "மீகா", "Nahum": "நாகூம்", "Habakkuk": "ஆபகூக்", "Zephaniah": "செப்பனியா", "Haggai": "ஆகாய்", "Zechariah": "சகரியா", "Malachi": "மல்கியா",
  "Matthew": "மத்தேயு", "Mark": "மாற்கு", "Luke": "லூக்கா", "John": "யோவான்", "Acts": "அப்போஸ்தலர்", "Romans": "ரோமர்", "1 Corinthians": "1 கொரிந்தியர்", "2 Corinthians": "2 கொரிந்தியர்", "Galatians": "கலாத்தியர்", "Ephesians": "எபேசியர்", "Philippians": "பிலிப்பியர்", "Colossians": "கொலோசெயர்", "1 Thessalonians": "1 தெசலோனிக்கேயர்", "2 Thessalonians": "2 தெசலோனிக்கேயர்", "1 Timothy": "1 தீமோத்தேயு", "2 Timothy": "2 தீமோத்தேயு", "Titus": "தீத்து", "Philemon": "பிலேமோன்", "Hebrews": "எபிரெயர்", "James": "யாக்கோபு", "1 Peter": "1 பேதுரு", "2 Peter": "2 பேதுரு", "1 John": "1 யோவான்", "2 John": "2 யோவான்", "3 John": "3 யோவான்", "Jude": "யூதா", "Revelation": "வெளிப்படுத்தின விசேஷம்"
};

const getBookName = (bookEn, lang) => {
  return lang === "ta" ? (tamilBookNames[bookEn] || bookEn) : bookEn;
};

const highlightText = (text, query) => {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ?
      <mark key={index} className="bg-[#D4AF37]/40 text-inherit rounded-sm px-0.5">{part}</mark> :
      part
  );
};

const MOBILE_FONT_SIZES = [15, 17, 19, 21, 23];

const VerseItem = memo(({ verseNum, text, zoomLevel, fontIndex, isDark, onCopy, copiedVerse, searchQuery, isHighlighted, isMobile }) => {
  const fontSize = isMobile ? MOBILE_FONT_SIZES[fontIndex] : 22 * (zoomLevel / 100);
  const verseNumSize = isMobile ? 12 : Math.max(12, fontSize * 0.65);

  return (
    <div id={`verse-${verseNum}`} className={`flex group relative px-2 py-4 sm:px-4 sm:py-6 rounded-2xl transition-all duration-300 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-white'} ${isHighlighted ? (isDark ? 'bg-gray-800/80 shadow-md ring-1 ring-[#D4AF37]/50' : 'bg-white shadow-md ring-1 ring-[#D4AF37]/50') : ''}`}>
      <span className={`w-10 sm:w-14 flex-shrink-0 font-bold select-none pt-[0.3em] transition-colors ${isDark ? "text-[#D4AF37]" : "text-[#D4AF37]"}`} style={{ fontSize: `${verseNumSize}px` }}>
        {verseNum}
      </span>
      <p
        className={`flex-grow font-serif tracking-wide transition-all duration-200 ease-out ${isDark ? 'text-gray-100' : 'text-[#1E293B]'}`}
        style={{ fontSize: `${fontSize}px`, lineHeight: isMobile ? 1.8 : 1.95 }}
      >
        {highlightText(text, searchQuery)}
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onCopy(text, verseNum);
        }}
        className={`absolute right-4 top-4 p-2.5 rounded-xl bg-white/90 backdrop-blur shadow-sm border border-gray-100 text-gray-500 hover:text-[#54091b] opacity-0 group-hover:opacity-100 transition-all duration-300 dark:bg-gray-700/90 dark:border-gray-600 dark:text-gray-300 dark:hover:text-white ${copiedVerse === verseNum ? '!opacity-100 !bg-green-50 !text-green-600 dark:!bg-green-900/30 border-green-100' : 'scale-95 group-hover:scale-100'}`}
        title="Copy Verse"
      >
        {copiedVerse === verseNum ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
});

const CustomSelect = ({ value, options, onChange, isDark, label, minWidth = "160px" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyles, setDropdownStyles] = useState({});
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyles({
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 999999,
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };

    const handleScroll = (event) => {
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return;
      }
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
      window.addEventListener("resize", handleScroll, { passive: true });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen]);

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div className="w-full">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-bold text-sm outline-none shadow-sm min-h-[44px] ${isDark
            ? 'bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-600 focus:border-[#D4AF37]'
            : 'bg-[#F4EFE7] border-[#54091b]/20 text-[#54091b] hover:border-[#54091b]/50 focus:border-[#54091b]'
          } ${isOpen ? (isDark ? 'border-[#D4AF37]' : 'border-[#54091b] ring-2 ring-[#54091b]/10') : ''}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          style={dropdownStyles}
          className={`rounded-xl shadow-2xl border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#F4EFE7] border-[#54091b]/20'
          }`}>
          <div className="max-h-64 overflow-y-auto overscroll-contain resources-scrollbar">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 min-h-[44px] text-sm font-medium transition-colors ${value === opt.value
                    ? (isDark ? 'bg-gray-700 text-[#D4AF37] font-bold' : 'bg-[#54091b] text-[#F6EFE3]')
                    : (isDark ? 'text-gray-300 hover:bg-gray-700/50' : 'text-[#54091b]/80 hover:bg-[#54091b]/10 hover:text-[#54091b]')
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default function Bible() {
  const { t } = useLanguage();

  const [language, setLanguage] = useState("ta");
  const [fullBibleData, setFullBibleData] = useState({ en: null, ta: null });
  const [loading, setLoading] = useState(true);

  const [selectedBook, setSelectedBook] = useState("Genesis");
  const [selectedChapter, setSelectedChapter] = useState("1");

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Mobile Font Size State (1 = Normal/17px)
  const [fontIndex, setFontIndex] = useState(() => {
    const saved = localStorage.getItem("bible_mobile_font_index");
    return saved !== null ? parseInt(saved, 10) : 1;
  });

  const { isDarkMode, toggleTheme } = useTheme();
  const [copiedVerse, setCopiedVerse] = useState(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const contentRef = useRef(null);
  const chipsScrollRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("bible_mobile_font_index", fontIndex.toString());
  }, [fontIndex]);

  useEffect(() => {
    const fetchBibles = async () => {
      setLoading(true);
      try {
        const [enRes, taRes] = await Promise.all([
          fetch("/data/bible-en.json"),
          fetch("/data/bible-ta.json")
        ]);
        const enData = await enRes.json();
        const taData = await taRes.json();

        setFullBibleData({ en: enData, ta: taData });

        const books = Object.keys(taData);
        if (books.length > 0) {
          setSelectedBook(books[0]);
          setSelectedChapter("1");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBibles();
  }, []);

  const bibleData = fullBibleData[language];
  const hasData = bibleData !== null;

  const booksList = useMemo(() => hasData ? Object.keys(bibleData) : [], [bibleData, hasData]);
  const chaptersList = useMemo(() => {
    if (!hasData || !bibleData[selectedBook]) return [];
    return Object.keys(bibleData[selectedBook]).sort((a, b) => parseInt(a) - parseInt(b));
  }, [bibleData, selectedBook, hasData]);

  const currentVerses = useMemo(() => {
    if (!hasData || !bibleData[selectedBook] || !bibleData[selectedBook][selectedChapter]) return {};
    return bibleData[selectedBook][selectedChapter];
  }, [bibleData, selectedBook, selectedChapter, hasData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      setSearchQuery(searchInput);
    } else if (e.key === 'Escape') {
      setSearchInput("");
      setSearchQuery("");
    }
  };

  useEffect(() => {
    if (searchQuery && !chapterLoading) {
      const query = searchQuery.toLowerCase();
      let firstMatchVerse = null;

      for (const [verseNum, text] of Object.entries(currentVerses)) {
        if (text.toLowerCase().includes(query)) {
          firstMatchVerse = verseNum;
          break;
        }
      }

      if (firstMatchVerse) {
        setTimeout(() => {
          const el = document.getElementById(`verse-${firstMatchVerse}`);
          if (el) {
            const y = el.getBoundingClientRect().top + window.pageYOffset - 180;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 100);
      }
    }
  }, [searchQuery, currentVerses, chapterLoading]);

  const handleChapterChange = useCallback((newChapter) => {
    setChapterLoading(true);
    setTimeout(() => {
      setSelectedChapter(newChapter);
      setChapterLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Auto-scroll the chip into view on mobile
      if (isMobile && chipsScrollRef.current) {
         const btn = document.getElementById(`chip-ch-${newChapter}`);
         if (btn) {
            btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
         }
      }
    }, 150);
  }, [isMobile]);

  const handleBookChange = useCallback((newBook) => {
    setSelectedBook(newBook);
    const chaps = Object.keys(fullBibleData[language][newBook] || {}).sort((a, b) => parseInt(a) - parseInt(b));
    handleChapterChange(chaps[0] || "1");
  }, [fullBibleData, language, handleChapterChange]);

  const handleNextChapter = useCallback(() => {
    const currentIndex = chaptersList.indexOf(selectedChapter);
    if (currentIndex < chaptersList.length - 1) {
      handleChapterChange(chaptersList[currentIndex + 1]);
    } else {
      const bookIndex = booksList.indexOf(selectedBook);
      if (bookIndex < booksList.length - 1) {
        const nextBook = booksList[bookIndex + 1];
        handleBookChange(nextBook);
      }
    }
  }, [chaptersList, selectedChapter, booksList, selectedBook, handleBookChange, handleChapterChange]);

  const handlePrevChapter = useCallback(() => {
    const currentIndex = chaptersList.indexOf(selectedChapter);
    if (currentIndex > 0) {
      handleChapterChange(chaptersList[currentIndex - 1]);
    } else {
      const bookIndex = booksList.indexOf(selectedBook);
      if (bookIndex > 0) {
        const prevBook = booksList[bookIndex - 1];
        setSelectedBook(prevBook);
        const prevBookChapters = Object.keys(bibleData[prevBook]).sort((a, b) => parseInt(a) - parseInt(b));
        handleChapterChange(prevBookChapters[prevBookChapters.length - 1]);
      }
    }
  }, [chaptersList, selectedChapter, booksList, selectedBook, bibleData, handleChapterChange]);

  const getNextLabel = useCallback(() => {
    const currentIndex = chaptersList.indexOf(selectedChapter);
    if (currentIndex < chaptersList.length - 1) {
      return t("Next Chapter");
    } else {
      const bookIndex = booksList.indexOf(selectedBook);
      if (bookIndex < booksList.length - 1) {
        return `${t("Next Book")}: ${getBookName(booksList[bookIndex + 1], language)}`;
      }
    }
    return "";
  }, [chaptersList, selectedChapter, booksList, selectedBook, language, t]);

  const getPrevLabel = useCallback(() => {
    const currentIndex = chaptersList.indexOf(selectedChapter);
    if (currentIndex > 0) {
      return t("Previous Chapter");
    } else {
      const bookIndex = booksList.indexOf(selectedBook);
      if (bookIndex > 0) {
        return `${t("Previous Book")}: ${getBookName(booksList[bookIndex - 1], language)}`;
      }
    }
    return "";
  }, [chaptersList, selectedChapter, booksList, selectedBook, language, t]);

  const copyToClipboard = useCallback((text, verseId) => {
    navigator.clipboard.writeText(`${getBookName(selectedBook, language)} ${selectedChapter}:${verseId} - ${text}`);
    setCopiedVerse(verseId);
    setTimeout(() => setCopiedVerse(null), 2000);
  }, [selectedBook, selectedChapter, language]);

  const bookOptions = useMemo(() => booksList.map(b => ({ value: b, label: getBookName(b, language) })), [booksList, language]);
  const chapterOptions = useMemo(() => chaptersList.map(c => ({ value: c, label: `${t("Chapter")} ${c}` })), [chaptersList, t]);

  const isDark = isDarkMode;
  const bgMain = isDark ? "bg-[#0f172a]" : "bg-[#F8F4EC]";
  const bgToolbar = isDark ? "bg-[#1e293b]/95 backdrop-blur-md" : "bg-white/95 backdrop-blur-md shadow-sm";
  const borderCol = isDark ? "border-gray-700/50" : "border-[#E8DCCB]";

  return (
    <div className={`min-h-[calc(100vh-80px)] flex flex-col transition-colors duration-500 ${bgMain}`}>
      
      {/* 
        Sticky Desktop Toolbar 
      */}
      <div className={`hidden md:block ${bgToolbar} border-b ${borderCol} sticky top-[var(--navbar-height)] z-40 transition-colors duration-500`}>
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-[200px]">
              <CustomSelect value={selectedBook} options={bookOptions} onChange={handleBookChange} isDark={isDark} />
            </div>
            <div className="w-[140px]">
              <CustomSelect value={selectedChapter} options={chapterOptions} onChange={handleChapterChange} isDark={isDark} />
            </div>
          </div>
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="relative w-64 shrink-0 group">
              <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-400 group-focus-within:text-[#D4AF37]' : 'text-[#54091b]/50 group-focus-within:text-[#54091b]'}`} />
              <input
                type="text"
                placeholder={t("Search in chapter...")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchSubmit}
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border-2 transition-all text-sm font-medium outline-none min-h-[44px] ${isDark
                    ? 'border-gray-700 bg-gray-800 text-white focus:border-[#D4AF37]'
                    : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] focus:border-[#54091b] focus:bg-white placeholder-[#54091b]/40'
                  }`}
              />
            </div>
            <div className="flex items-center justify-end gap-3 shrink-0">
              <div className={`flex items-center gap-1 p-1.5 rounded-xl shrink-0 ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7] border border-[#54091b]/10'}`}>
                <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))} className={`p-1.5 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-white hover:shadow-sm text-[#54091b]/70 hover:text-[#54091b]'}`} title="Decrease zoom"><Minus size={16} /></button>
                <span className={`text-xs font-bold w-12 text-center select-none ${isDark ? 'text-gray-300' : 'text-[#54091b]'}`}>{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))} className={`p-1.5 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-white hover:shadow-sm text-[#54091b]/70 hover:text-[#54091b]'}`} title="Increase zoom"><Plus size={16} /></button>
                <div className={`w-px h-5 mx-1 ${isDark ? 'bg-gray-700' : 'bg-[#54091b]/20'}`}></div>
                <button onClick={() => setZoomLevel(100)} className={`p-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 min-h-[32px] min-w-[32px] ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-white hover:shadow-sm text-[#54091b]/70 hover:text-[#54091b]'}`} title="Reset zoom"><RotateCcw size={14} /></button>
              </div>
              <div className={`flex items-center rounded-xl p-1 shrink-0 ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7] border border-[#54091b]/10'}`}>
                <button onClick={() => setLanguage("ta")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 text-center min-h-[32px] ${language === "ta" ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#54091b]/60 hover:text-[#54091b]')}`}>தமிழ்</button>
                <button onClick={() => setLanguage("en")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 text-center min-h-[32px] ${language === "en" ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#54091b]/60 hover:text-[#54091b]')}`}>EN</button>
              </div>
              <button onClick={toggleTheme} className={`p-2.5 rounded-xl transition-colors border-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center ${isDark ? 'border-gray-700 bg-gray-800 text-yellow-400 hover:border-gray-600' : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] hover:border-[#54091b]/30'}`} title="Toggle Theme">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
            </div>
          </div>
        </div>
      </div>

      {/* 
        Sticky Mobile Toolbar 
      */}
      <div className={`md:hidden ${bgToolbar} sticky top-[var(--navbar-height)] z-40 px-4 py-3 border-b ${borderCol} flex flex-col gap-3 shadow-[0_4px_10px_rgba(0,0,0,0.05)]`}>
        
        {/* Row 1: Book Selector & Chapter Header */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <CustomSelect value={selectedBook} options={bookOptions} onChange={handleBookChange} isDark={isDark} />
          </div>
          <div className={`font-black text-lg whitespace-nowrap px-1 ${isDark ? 'text-white' : 'text-[#54091b]'}`}>
             {t("Chapter")} {selectedChapter}
          </div>
        </div>

        {/* Row 2: Search */}
        <div className="relative w-full group">
          <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-400 group-focus-within:text-[#D4AF37]' : 'text-[#54091b]/50 group-focus-within:text-[#54091b]'}`} />
          <input
            type="text"
            placeholder={t("Search in chapter...")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchSubmit}
            className={`w-full pl-10 pr-3 py-2 min-h-[44px] rounded-xl border-2 transition-all text-[16px] font-medium outline-none ${isDark
                ? 'border-gray-700 bg-gray-800 text-white focus:border-[#D4AF37]'
                : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] focus:border-[#54091b] focus:bg-white placeholder-[#54091b]/40'
              }`}
          />
        </div>

        {/* Row 3: Action Controls */}
        <div className="flex items-center justify-between gap-3">
          <button 
            onClick={toggleTheme} 
            aria-label="Toggle Theme"
            className={`p-2.5 rounded-xl transition-colors border-2 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center ${isDark ? 'border-gray-700 bg-gray-800 text-yellow-400 hover:border-gray-600' : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] hover:border-[#54091b]/30'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className={`flex flex-1 items-center rounded-xl p-1 min-h-[44px] ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7] border border-[#54091b]/10'}`}>
            <button aria-label="Switch to Tamil" onClick={() => setLanguage("ta")} className={`flex-1 px-2 py-2 text-xs font-bold rounded-lg transition-all duration-300 text-center ${language === "ta" ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400' : 'text-[#54091b]/60')}`}>தமிழ்</button>
            <button aria-label="Switch to English" onClick={() => setLanguage("en")} className={`flex-1 px-2 py-2 text-xs font-bold rounded-lg transition-all duration-300 text-center ${language === "en" ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400' : 'text-[#54091b]/60')}`}>EN</button>
          </div>

          <div className={`flex flex-1 items-center rounded-xl p-1 min-h-[44px] ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7] border border-[#54091b]/10'}`}>
            <button aria-label="Decrease font size" onClick={() => setFontIndex(Math.max(0, fontIndex - 1))} disabled={fontIndex === 0} className={`flex-1 px-2 py-2 text-sm font-bold rounded-lg transition-all text-center flex justify-center items-center gap-1 ${isDark ? 'text-gray-300 hover:bg-gray-700 disabled:opacity-30' : 'text-[#54091b] hover:bg-white/50 disabled:opacity-30'}`}>A−</button>
            <div className={`w-px h-4 ${isDark ? 'bg-gray-700' : 'bg-[#54091b]/20'}`}></div>
            <button aria-label="Increase font size" onClick={() => setFontIndex(Math.min(4, fontIndex + 1))} disabled={fontIndex === 4} className={`flex-1 px-2 py-2 text-sm font-bold rounded-lg transition-all text-center flex justify-center items-center gap-1 ${isDark ? 'text-gray-300 hover:bg-gray-700 disabled:opacity-30' : 'text-[#54091b] hover:bg-white/50 disabled:opacity-30'}`}>A+</button>
          </div>
        </div>

        {/* Row 4: Chapter Chips */}
        <div ref={chipsScrollRef} className="flex items-center gap-2 overflow-x-auto resources-scrollbar pb-1 pt-1 -mx-4 px-4 scroll-smooth">
          {chaptersList.map(c => (
            <button 
              key={c}
              id={`chip-ch-${c}`}
              onClick={() => handleChapterChange(c)}
              className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${selectedChapter === c ? (isDark ? 'bg-[#D4AF37] text-gray-900 shadow-md' : 'bg-[#54091b] text-white shadow-md') : (isDark ? 'border border-gray-700 text-gray-300 bg-gray-800' : 'border border-[#54091b]/20 text-[#54091b] bg-[#F4EFE7]')}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Main Reading Area */}
      <div ref={contentRef} className="flex-grow scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 md:px-5 py-6 md:py-12 sm:py-20">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-0 animate-fade-in delay-200">
              <div className={`w-10 h-10 border-3 border-[#54091b]/10 border-t-[#D4AF37] rounded-full animate-spin`}></div>
            </div>
          ) : (
            <div className={`pb-24 transition-opacity duration-300 ${chapterLoading ? 'opacity-0' : 'opacity-100'}`}>
              <div className="text-center mb-8 md:mb-12 sm:mb-20 animate-fade-in hidden md:block">
                <h2 className={`font-black tracking-tight flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 ${isDark ? 'text-white' : 'text-[#54091b]'}`}>
                  <span className="text-[24px] sm:text-5xl">{getBookName(selectedBook, language)}</span>
                  <span className="hidden sm:inline opacity-50">|</span>
                  <span className="text-[18px] sm:text-5xl opacity-80 sm:opacity-100">{t("Chapter")} {selectedChapter}</span>
                </h2>
                <div className={`h-1 sm:h-1.5 w-16 sm:w-20 bg-[#D4AF37] mx-auto mt-6 sm:mt-8 rounded-full`}></div>
              </div>

              <div className="space-y-4 md:space-y-2 sm:space-y-2 animate-fade-in-up mt-4 md:mt-0">
                {Object.entries(currentVerses).map(([verseNum, text]) => (
                  <VerseItem
                    key={verseNum}
                    verseNum={verseNum}
                    text={text}
                    zoomLevel={zoomLevel}
                    fontIndex={fontIndex}
                    isDark={isDark}
                    onCopy={copyToClipboard}
                    copiedVerse={copiedVerse}
                    searchQuery={searchQuery}
                    isHighlighted={searchQuery && text.toLowerCase().includes(searchQuery.toLowerCase())}
                    isMobile={isMobile}
                  />
                ))}
              </div>

              {/* Bottom Navigation */}
              <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 mt-16 md:mt-24 pt-8 md:pt-12 border-t ${borderCol}`}>
                {getPrevLabel() ? (
                  <button
                    onClick={handlePrevChapter}
                    className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 min-h-[44px] rounded-2xl font-bold text-sm transition-all duration-300 ${isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-white border-2 border-gray-700'
                        : 'bg-white hover:bg-[#F4EFE7] text-[#54091b] border-2 border-[#E8DCCB] hover:border-[#54091b]/30 hover:shadow-md'
                      }`}
                  >
                    <ChevronLeft size={18} />
                    {getPrevLabel()}
                  </button>
                ) : <div className="hidden sm:block" />}

                {getNextLabel() ? (
                  <button
                    onClick={handleNextChapter}
                    className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 min-h-[44px] rounded-2xl font-bold text-sm transition-all duration-300 ${isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-white border-2 border-gray-700'
                        : 'bg-white hover:bg-[#F4EFE7] text-[#54091b] border-2 border-[#E8DCCB] hover:border-[#54091b]/30 hover:shadow-md'
                      }`}
                  >
                    {getNextLabel()}
                    <ChevronRight size={18} />
                  </button>
                ) : <div className="hidden sm:block" />}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
