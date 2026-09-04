import { useState, useEffect, useMemo, useRef, memo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import {
  ChevronLeft, ChevronRight, Search, Moon, Sun,
  Copy, ChevronDown, Minus, Plus, RotateCcw, X, Image,

} from "lucide-react";
import { toast } from 'react-toastify';
import ShareImageModal from "../components/ShareImageModal";

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

const MOBILE_FONT_SIZES = [80, 90, 100, 110, 120];

const VerseItem = memo(({ verseNum, text, zoomLevel, fontIndex, isDark, onToggleSelect, isSelected, showActions, onCopyAction, onShareAction, isMobile }) => {
  const fontSizeCss = isMobile ? `${MOBILE_FONT_SIZES[fontIndex]}%` : `${22 * (zoomLevel / 100)}px`;
  const desktopFontSize = 22 * (zoomLevel / 100);
  const verseNumSizeCss = isMobile ? '12px' : `${Math.max(12, desktopFontSize * 0.65)}px`;

  return (
    <div
      id={`verse-${verseNum}`}
      onClick={() => onToggleSelect(verseNum)}
      className={`flex group relative px-2 py-4 sm:px-4 sm:py-6 rounded-2xl transition-all duration-300 border-l-4 cursor-pointer select-none ${isDark ? 'hover:bg-gray-800' : 'hover:bg-white'} ${isSelected ? '!bg-[#D4AF37]/20 !border-[#D4AF37]' : 'border-transparent'} `}>
      <span className={`w-10 sm:w-14 flex-shrink-0 font-bold select-none pt-[0.3em] transition-colors ${isDark ? "text-[#D4AF37]" : "text-[#D4AF37]"}`} style={{ fontSize: verseNumSizeCss }}>
        {verseNum}
      </span>
      <p
        className={`flex-grow font-serif tracking-wide transition-all duration-200 ease-out ${isDark ? 'text-gray-100' : 'text-[#1E293B]'}`}
        style={{ fontSize: fontSizeCss, lineHeight: isMobile ? 1.8 : 1.95 }}
      >
        {text}
      </p>

      {showActions && (
        <div className="absolute top-full right-4 sm:right-8 z-50 -mt-3 animate-in fade-in zoom-in duration-200">
          <div className={`flex items-center gap-1 p-1.5 rounded-xl shadow-lg border backdrop-blur-md ${isDark ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-100'}`}>
            <button onClick={(e) => { e.stopPropagation(); onCopyAction(); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors outline-none ${isDark ? 'text-gray-300 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]' : 'text-[#54091b]/80 hover:bg-[#F4EFE7] hover:text-[#54091b]'}`}>
              <Copy size={16} /> Copy
            </button>
            <div className={`w-px h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <button onClick={(e) => { e.stopPropagation(); onShareAction(); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors outline-none ${isDark ? 'text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]' : 'text-[#D4AF37] hover:bg-[#F4EFE7] hover:text-[#b8952a]'}`}>
              <Image size={16} /> Share Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

const CustomSelect = ({ value, options, onChange, isDark }) => {
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
          ? 'bg-gray-800 border-gray-700 text-gray-200 hover:border-[#D4AF37]/50 focus:border-[#D4AF37] focus:shadow-[0_0_8px_rgba(212,175,55,0.3)]'
          : 'bg-[#F4EFE7] border-[#54091b]/20 text-[#54091b] hover:border-[#54091b]/50 focus:border-[#54091b]'
          } ${isOpen ? (isDark ? 'border-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'border-[#54091b] ring-2 ring-[#54091b]/10') : ''}`}
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
                  ? (isDark ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-bold border-l-2 border-[#D4AF37]' : 'bg-[#54091b] text-[#F6EFE3]')
                  : (isDark ? 'text-gray-300 hover:bg-gray-700/50 hover:text-[#D4AF37] border-l-2 border-transparent' : 'text-[#54091b]/80 hover:bg-[#54091b]/10 hover:text-[#54091b]')
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [focusedResultIndex, setFocusedResultIndex] = useState(-1);
  const [highlightedVerseId, setHighlightedVerseId] = useState(null);
  const searchContainerRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedVerses, setSelectedVerses] = useState([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [verseToShare, setVerseToShare] = useState(null);

  // Mobile Font Size State (1 = Normal/17px)
  const [fontIndex, setFontIndex] = useState(() => {
    const saved = localStorage.getItem("bible_mobile_font_index");
    return saved !== null ? parseInt(saved, 10) : 1;
  });

  const { isDarkMode, toggleTheme } = useTheme();
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

  const flatBibleIndex = useMemo(() => {
    if (!hasData) return [];
    const index = [];
    for (const book of Object.keys(bibleData)) {
      for (const chapter of Object.keys(bibleData[book])) {
        for (const [verseNum, text] of Object.entries(bibleData[book][chapter])) {
          index.push({ book, chapter, verseNum, text });
        }
      }
    }
    return index;
  }, [bibleData, hasData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      if (searchInput.trim().length > 0) {
        setIsSearchOpen(true);
      } else {
        setIsSearchOpen(false);
      }
      setFocusedResultIndex(-1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const searchResults = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    const query = debouncedSearch.toLowerCase();
    return flatBibleIndex.filter(item => item.text.toLowerCase().includes(query)).slice(0, 50);
  }, [debouncedSearch, flatBibleIndex]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target) &&
        mobileSearchContainerRef.current && !mobileSearchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChapterChange = useCallback((newChapter) => {
    setChapterLoading(true);
    setTimeout(() => {
      setSelectedChapter(newChapter);
      setSelectedVerses([]);
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
    setSelectedVerses([]);
    const chaps = Object.keys(fullBibleData[language][newBook] || {}).sort((a, b) => parseInt(a) - parseInt(b));
    handleChapterChange(chaps[0] || "1");
  }, [fullBibleData, language, handleChapterChange]);

  const handleResultClick = useCallback((result) => {
    setIsSearchOpen(false);
    setSearchInput("");
    setDebouncedSearch("");

    if (selectedBook !== result.book) {
      setSelectedBook(result.book);
    }
    if (selectedBook !== result.book || selectedChapter !== result.chapter) {
      handleChapterChange(result.chapter);
    }

    const scrollAndHighlight = () => {
      setTimeout(() => {
        const el = document.getElementById(`verse-${result.verseNum}`);
        if (el) {
          const y = el.getBoundingClientRect().top + window.pageYOffset - 180;
          window.scrollTo({ top: y, behavior: 'smooth' });
          setHighlightedVerseId(result.verseNum);
          setTimeout(() => setHighlightedVerseId(null), 3000);
        } else {
          setTimeout(() => {
            const elRetry = document.getElementById(`verse-${result.verseNum}`);
            if (elRetry) {
              const y = elRetry.getBoundingClientRect().top + window.pageYOffset - 180;
              window.scrollTo({ top: y, behavior: 'smooth' });
              setHighlightedVerseId(result.verseNum);
              setTimeout(() => setHighlightedVerseId(null), 3000);
            }
          }, 400);
        }
      }, 150);
    };
    scrollAndHighlight();

  }, [selectedBook, selectedChapter, handleChapterChange]);

  const handleKeyDown = (e) => {
    if (!isSearchOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedResultIndex(prev => {
        const next = prev < searchResults.length - 1 ? prev + 1 : prev;
        const el = document.getElementById(isMobile ? `mob-search-res-${next}` : `search-res-${next}`);
        if (el) el.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedResultIndex(prev => {
        const next = prev > 0 ? prev - 1 : 0;
        const el = document.getElementById(isMobile ? `mob-search-res-${next}` : `search-res-${next}`);
        if (el) el.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedResultIndex >= 0 && focusedResultIndex < searchResults.length) {
        handleResultClick(searchResults[focusedResultIndex]);
      } else if (searchResults.length > 0) {
        handleResultClick(searchResults[0]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

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

  const handleToggleSelect = useCallback((verseNum) => {
    setSelectedVerses(prev => {
      if (prev.includes(verseNum)) {
        return prev.filter(v => v !== verseNum);
      }
      return [...prev, verseNum].sort((a, b) => parseInt(a) - parseInt(b));
    });
  }, []);

  const handleCopySelection = useCallback(() => {
    if (selectedVerses.length === 0) return;

    const verseRef = selectedVerses.length > 1
      ? `${selectedVerses[0]}-${selectedVerses[selectedVerses.length - 1]}`
      : selectedVerses[0];
    const bookName = getBookName(selectedBook, language);
    const reference = `${bookName} ${selectedChapter}:${verseRef}`;
    const footer = language === 'ta' ? '— பரிசுத்த வேதாகமம்' : '— Holy Bible';

    let textToCopy = "";
    if (selectedVerses.length === 1) {
      textToCopy = `"${currentVerses[selectedVerses[0]]}"`;
    } else {
      textToCopy = selectedVerses.map(v => `${v}. ${currentVerses[v]}`).join('\n\n');
    }

    const formattedText = `${reference}\n\n${textToCopy}\n\n${footer}`;

    navigator.clipboard.writeText(formattedText);
    console.log(formattedText);

    if (language === 'ta') {
      toast.success("✓ வசனம் நகலெடுக்கப்பட்டது", { position: "bottom-center", autoClose: 2000, hideProgressBar: true });
    } else {
      toast.success("✓ Verse copied successfully", { position: "bottom-center", autoClose: 2000, hideProgressBar: true });
    }
    setSelectedVerses([]);
  }, [selectedVerses, currentVerses, selectedBook, selectedChapter, language]);

  const handleShareImage = useCallback(() => {
    if (selectedVerses.length === 0) return;

    let textToShare = "";
    if (selectedVerses.length === 1) {
      textToShare = currentVerses[selectedVerses[0]];
    } else {
      textToShare = selectedVerses.map(v => `${v}. ${currentVerses[v]}`).join('\n\n');
    }

    const verseRef = selectedVerses.length > 1
      ? `${selectedVerses[0]}-${selectedVerses[selectedVerses.length - 1]}`
      : selectedVerses[0];

    setVerseToShare({
      bookEn: selectedBook,
      bookLocalized: getBookName(selectedBook, language),
      chapter: selectedChapter,
      verseNum: verseRef,
      text: textToShare,
      language: language,
      isMultiple: selectedVerses.length > 1
    });
    setShareModalOpen(true);
    setSelectedVerses([]);
  }, [selectedVerses, currentVerses, selectedBook, selectedChapter, language]);

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
      <div className={`hidden md:block ${bgToolbar} border-b ${borderCol} sticky top-20 z-40 transition-colors duration-500`}>
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex flex-wrap items-center gap-3">
          <div className="flex-[0_0_220px]">
            <CustomSelect value={selectedBook} options={bookOptions} onChange={handleBookChange} isDark={isDark} />
          </div>
          <div className="flex-[0_0_170px]">
            <CustomSelect value={selectedChapter} options={chapterOptions} onChange={handleChapterChange} isDark={isDark} />
          </div>
          <div ref={searchContainerRef} className="relative flex-1 min-w-[320px] max-w-[520px] group">
            <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-400 group-focus-within:text-[#D4AF37]' : 'text-[#54091b]/50 group-focus-within:text-[#54091b]'}`} />
            <input
              type="text"
              placeholder={t("Search the entire Bible...")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (searchInput.trim().length > 0) setIsSearchOpen(true); }}
              className={`w-full pl-10 pr-9 py-2.5 rounded-xl border-2 transition-all text-sm font-medium outline-none min-h-[44px] ${isDark
                ? 'border-gray-700 bg-gray-800 text-white hover:border-[#D4AF37]/50 focus:border-[#D4AF37] focus:shadow-[0_0_8px_rgba(212,175,55,0.3)]'
                : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] focus:border-[#54091b] focus:bg-white placeholder-[#54091b]/40'
                }`}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setIsSearchOpen(false); setDebouncedSearch(""); }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1 rounded-full ${isDark ? 'text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10' : 'text-[#54091b]/50 hover:text-[#54091b] hover:bg-[#54091b]/10'}`}
              >
                <X size={14} />
              </button>
            )}
            {isSearchOpen && (
              <div className={`absolute top-full right-0 mt-2 w-[400px] max-h-[420px] overflow-y-auto rounded-2xl shadow-xl border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 resources-scrollbar ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#F4EFE7] border-[#E8DCCB]'}`}>
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, idx) => (
                      <div
                        key={idx}
                        id={`search-res-${idx}`}
                        onClick={() => handleResultClick(result)}
                        className={`px-4 py-3 cursor-pointer transition-colors ${focusedResultIndex === idx ? (isDark ? 'bg-[#D4AF37]/10' : 'bg-[#54091b]/10') : (isDark ? 'hover:bg-[#D4AF37]/10' : 'hover:bg-[#54091b]/5')} ${idx !== searchResults.length - 1 ? (isDark ? 'border-b border-gray-700' : 'border-b border-[#E8DCCB]') : ''}`}
                      >
                        <div className={`text-xs font-bold mb-1 ${isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'}`}>
                          {getBookName(result.book, language)} {result.chapter}:{result.verseNum}
                        </div>
                        <div className={`font-serif line-clamp-2 ${isDark ? 'text-gray-300' : 'text-[#1E293B]'} ${!isMobile ? 'text-sm' : ''}`} style={{ fontSize: isMobile ? `${MOBILE_FONT_SIZES[fontIndex]}%` : undefined }}>
                          {highlightText(result.text, debouncedSearch)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`px-4 py-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-[#54091b]/60'}`}>
                    No verses found.<br />Try another word.
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 ml-auto shrink-0">


            <div className={`flex items-center gap-1 p-1.5 rounded-xl shrink-0 ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7] border border-[#54091b]/10'}`}>
              <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))} className={`p-1.5 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center outline-none ${isDark ? 'hover:bg-[#D4AF37]/10 text-gray-400 hover:text-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]' : 'hover:bg-white hover:shadow-sm text-[#54091b]/70 hover:text-[#54091b]'}`} title="Decrease zoom"><Minus size={16} /></button>
              <span className={`text-xs font-bold w-12 text-center select-none ${isDark ? 'text-gray-300' : 'text-[#54091b]'}`}>{zoomLevel}%</span>
              <button onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))} className={`p-1.5 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center outline-none ${isDark ? 'hover:bg-[#D4AF37]/10 text-gray-400 hover:text-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]' : 'hover:bg-white hover:shadow-sm text-[#54091b]/70 hover:text-[#54091b]'}`} title="Increase zoom"><Plus size={16} /></button>
              <div className={`w-px h-5 mx-1 ${isDark ? 'bg-gray-700' : 'bg-[#54091b]/20'}`}></div>
              <button onClick={() => setZoomLevel(100)} className={`p-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 min-h-[32px] min-w-[32px] outline-none ${isDark ? 'hover:bg-[#D4AF37]/10 text-gray-400 hover:text-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]' : 'hover:bg-white hover:shadow-sm text-[#54091b]/70 hover:text-[#54091b]'}`} title="Reset zoom"><RotateCcw size={14} /></button>
            </div>
            <div className={`flex items-center rounded-xl p-1 shrink-0 ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7] border border-[#54091b]/10'}`}>
              <button onClick={() => setLanguage("ta")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 text-center min-h-[32px] outline-none ${language === "ta" ? (isDark ? 'bg-[#D4AF37] text-gray-900 shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400 hover:text-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]' : 'text-[#54091b]/60 hover:text-[#54091b]')}`}>தமிழ்</button>
              <button onClick={() => setLanguage("en")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 text-center min-h-[32px] outline-none ${language === "en" ? (isDark ? 'bg-[#D4AF37] text-gray-900 shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400 hover:text-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]' : 'text-[#54091b]/60 hover:text-[#54091b]')}`}>EN</button>
            </div>
            <button onClick={toggleTheme} className={`p-2.5 rounded-xl transition-all border-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center outline-none ${isDark ? 'border-gray-700 bg-gray-800 text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 focus:border-[#D4AF37] focus:shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] hover:border-[#54091b]/30'}`} title="Toggle Theme">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
        </div>
      </div>

      {/* 
        Sticky Mobile Toolbar 
      */}
      <div className={`md:hidden ${bgToolbar} sticky top-20 z-40 px-4 py-3 border-b ${borderCol} flex flex-col gap-3 shadow-[0_4px_10px_rgba(0,0,0,0.05)]`}>

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
        <div ref={mobileSearchContainerRef} className="relative w-full group">
          <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-400 group-focus-within:text-[#D4AF37]' : 'text-[#54091b]/50 group-focus-within:text-[#54091b]'}`} />
          <input
            type="text"
            placeholder={t("Search the entire Bible...")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (searchInput.trim().length > 0) setIsSearchOpen(true); }}
            className={`w-full pl-10 pr-9 py-2 min-h-[44px] rounded-xl border-2 transition-all text-[16px] font-medium outline-none ${isDark
              ? 'border-gray-700 bg-gray-800 text-white hover:border-[#D4AF37]/50 focus:border-[#D4AF37] focus:shadow-[0_0_8px_rgba(212,175,55,0.3)]'
              : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] focus:border-[#54091b] focus:bg-white placeholder-[#54091b]/40'
              }`}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); setIsSearchOpen(false); setDebouncedSearch(""); }}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1 rounded-full ${isDark ? 'text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10' : 'text-[#54091b]/50 hover:text-[#54091b] hover:bg-[#54091b]/10'}`}
            >
              <X size={14} />
            </button>
          )}
          {isSearchOpen && (
            <div className={`absolute top-[calc(100%+8px)] left-0 w-full max-h-[50vh] overflow-y-auto rounded-2xl shadow-xl border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 resources-scrollbar ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#F4EFE7] border-[#E8DCCB]'}`}>
              {searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      id={`mob-search-res-${idx}`}
                      onClick={() => handleResultClick(result)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${focusedResultIndex === idx ? (isDark ? 'bg-gray-700' : 'bg-[#54091b]/10') : (isDark ? 'hover:bg-gray-700/50' : 'hover:bg-[#54091b]/5')} ${idx !== searchResults.length - 1 ? (isDark ? 'border-b border-gray-700' : 'border-b border-[#E8DCCB]') : ''}`}
                    >
                      <div className={`text-xs font-bold mb-1 ${isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'}`}>
                        {getBookName(result.book, language)} {result.chapter}:{result.verseNum}
                      </div>
                      <div className={`font-serif line-clamp-2 ${isDark ? 'text-gray-300' : 'text-[#1E293B]'} ${!isMobile ? 'text-sm' : ''}`} style={{ fontSize: isMobile ? `${MOBILE_FONT_SIZES[fontIndex]}%` : undefined }}>
                        {highlightText(result.text, debouncedSearch)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`px-4 py-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-[#54091b]/60'}`}>
                  No verses found.<br />Try another word.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 3: Action Controls */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto resources-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">


          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className={`p-2.5 rounded-xl transition-all border-2 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center outline-none ${isDark ? 'border-gray-700 bg-gray-800 text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 focus:border-[#D4AF37] focus:shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] hover:border-[#54091b]/30'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className={`flex flex-1 items-center rounded-xl p-1 min-h-[44px] shrink-0 ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7] border border-[#54091b]/10'}`}>
            <button aria-label="Switch to Tamil" onClick={() => setLanguage("ta")} className={`flex-1 px-2 py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all duration-300 text-center min-w-[36px] outline-none ${language === "ta" ? (isDark ? 'bg-[#D4AF37] text-gray-900 shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400 hover:text-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]' : 'text-[#54091b]/60')}`}>TA</button>
            <button aria-label="Switch to English" onClick={() => setLanguage("en")} className={`flex-1 px-2 py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all duration-300 text-center min-w-[36px] outline-none ${language === "en" ? (isDark ? 'bg-[#D4AF37] text-gray-900 shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400 hover:text-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]' : 'text-[#54091b]/60')}`}>EN</button>
          </div>

          <div className={`flex flex-1 items-center rounded-xl p-1 min-h-[44px] shrink-0 ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7] border border-[#54091b]/10'}`}>
            <button aria-label="Decrease font size" onClick={() => setFontIndex(Math.max(0, fontIndex - 1))} disabled={fontIndex === 0} className={`flex-1 px-2 py-2 text-sm font-bold rounded-lg transition-all text-center flex justify-center items-center gap-1 outline-none ${isDark ? 'text-gray-300 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] disabled:opacity-30' : 'text-[#54091b] hover:bg-white/50 disabled:opacity-30'}`}>{language === "ta" ? "அ−" : "A−"}</button>
            <div className={`w-px h-4 mx-0.5 ${isDark ? 'bg-gray-700' : 'bg-[#54091b]/20'}`}></div>
            <button aria-label="Increase font size" onClick={() => setFontIndex(Math.min(4, fontIndex + 1))} disabled={fontIndex === 4} className={`flex-1 px-2 py-2 text-sm font-bold rounded-lg transition-all text-center flex justify-center items-center gap-1 outline-none ${isDark ? 'text-gray-300 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] disabled:opacity-30' : 'text-[#54091b] hover:bg-white/50 disabled:opacity-30'}`}>{language === "ta" ? "அ+" : "A+"}</button>
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
                    onToggleSelect={handleToggleSelect}
                    isSelected={highlightedVerseId === verseNum || selectedVerses.includes(verseNum)}

                    showActions={selectedVerses.length > 0 && selectedVerses[selectedVerses.length - 1] === verseNum}
                    onCopyAction={handleCopySelection}
                    onShareAction={handleShareImage}
                    isMobile={isMobile}
                  />
                ))}
              </div>

              {/* Bottom Navigation */}
              <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 mt-16 md:mt-24 pt-8 md:pt-12 border-t ${borderCol}`}>
                {getPrevLabel() ? (
                  <button
                    onClick={handlePrevChapter}
                    className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 min-h-[44px] rounded-2xl font-bold text-sm transition-all duration-300 outline-none ${isDark
                      ? 'bg-gray-800 hover:bg-gray-800 text-white border-2 border-gray-700 hover:border-[#D4AF37]/50 focus:border-[#D4AF37] focus:shadow-[0_0_8px_rgba(212,175,55,0.3)] hover:text-[#D4AF37]'
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
                    className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 min-h-[44px] rounded-2xl font-bold text-sm transition-all duration-300 outline-none ${isDark
                      ? 'bg-gray-800 hover:bg-gray-800 text-white border-2 border-gray-700 hover:border-[#D4AF37]/50 focus:border-[#D4AF37] focus:shadow-[0_0_8px_rgba(212,175,55,0.3)] hover:text-[#D4AF37]'
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

      <ShareImageModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        verseData={verseToShare}
      />


    </div>
  );
}
