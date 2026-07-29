import { useState, useEffect, useMemo, useRef, memo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import {
  ChevronLeft, ChevronRight, Search, Moon, Sun,
  Copy, Check, ChevronDown, Minus, Plus, RotateCcw, X, Image,
  Volume2, Pause, Play, Square, SkipBack, SkipForward, Loader2, Headphones
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

const MOBILE_FONT_SIZES = [15, 17, 19, 21, 23];

const VerseItem = memo(({ verseNum, text, zoomLevel, fontIndex, isDark, onToggleSelect, isSelected, isReadingVerse, showActions, onCopyAction, onShareAction, isMobile }) => {
  const fontSize = isMobile ? MOBILE_FONT_SIZES[fontIndex] : 22 * (zoomLevel / 100);
  const verseNumSize = isMobile ? 12 : Math.max(12, fontSize * 0.65);

  return (
    <div 
      id={`verse-${verseNum}`} 
      onClick={() => onToggleSelect(verseNum)}
      className={`flex group relative px-2 py-4 sm:px-4 sm:py-6 rounded-2xl transition-all duration-300 border-l-4 cursor-pointer select-none ${isDark ? 'hover:bg-gray-800' : 'hover:bg-white'} ${isSelected ? '!bg-[#D4AF37]/20 !border-[#D4AF37]' : 'border-transparent'} ${isReadingVerse ? '!bg-[#D4AF37]/30 !border-[#D4AF37] shadow-[inset_0_0_20px_rgba(212,175,55,0.15)] ring-2 ring-[#D4AF37]/50' : ''}`}>
      <span className={`w-10 sm:w-14 flex-shrink-0 font-bold select-none pt-[0.3em] transition-colors ${isDark ? "text-[#D4AF37]" : "text-[#D4AF37]"}`} style={{ fontSize: `${verseNumSize}px` }}>
        {verseNum}
      </span>
      <p
        className={`flex-grow font-serif tracking-wide transition-all duration-200 ease-out ${isDark ? 'text-gray-100' : 'text-[#1E293B]'}`}
        style={{ fontSize: `${fontSize}px`, lineHeight: isMobile ? 1.8 : 1.95 }}
      >
        {text}
      </p>

      {showActions && (
        <div className="absolute top-full right-4 sm:right-8 z-50 -mt-3 animate-in fade-in zoom-in duration-200">
           <div className={`flex items-center gap-1 p-1.5 rounded-xl shadow-lg border backdrop-blur-md ${isDark ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-100'}`}>
              <button onClick={(e) => { e.stopPropagation(); onCopyAction(); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-[#54091b]/80 hover:bg-[#F4EFE7] hover:text-[#54091b]'}`}>
                 <Copy size={16} /> Copy
              </button>
              <div className={`w-px h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <button onClick={(e) => { e.stopPropagation(); onShareAction(); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${isDark ? 'text-[#D4AF37] hover:bg-gray-700 hover:text-yellow-400' : 'text-[#D4AF37] hover:bg-[#F4EFE7] hover:text-[#b8952a]'}`}>
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
  const [copiedVerse, setCopiedVerse] = useState(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

    // --- Audio Player (Cloud TTS + Fallback) State ---
  const [audioState, setAudioState] = useState('idle'); // 'idle', 'generating', 'playing', 'paused'
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioTimestamps, setAudioTimestamps] = useState([]);
  const [readSpeed, setReadSpeed] = useState(1);
  const [currentReadingVerse, setCurrentReadingVerse] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef(null);
  
  const [useFallback, setUseFallback] = useState(false);
  const [voices, setVoices] = useState([]);
  const [readingQueue, setReadingQueue] = useState([]);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) setVoices(availableVoices);
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  const getBestVoice = useCallback((lang) => {
    if (lang === 'ta') {
      return voices.find(v => v.lang.startsWith('ta-IN')) || 
             voices.find(v => v.lang.startsWith('ta-LK')) || 
             voices.find(v => v.lang.startsWith('ta')) || null;
    } else {
      return voices.find(v => v.lang.startsWith('en-IN')) || 
             voices.find(v => v.lang.startsWith('en-US')) || 
             voices.find(v => v.lang.startsWith('en-GB')) || 
             voices.find(v => v.lang.startsWith('en')) || null;
    }
  }, [voices]);

  const handleStopReading = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setAudioState('idle');
    setCurrentReadingVerse(null);
    setAudioUrl(null);
    setAudioTimestamps([]);
    setReadingQueue([]);
    setAudioProgress(0);
    setAudioDuration(0);
  }, []);

  const playVerseFallback = useCallback((verseId, queue) => {
    if (!verseId || typeof window === 'undefined' || !window.speechSynthesis) {
      handleStopReading();
      return;
    }
    window.speechSynthesis.cancel();
    setCurrentReadingVerse(verseId);
    
    setTimeout(() => {
      const el = document.getElementById(`verse-${verseId}`);
      if (el) {
         const y = el.getBoundingClientRect().top + window.pageYOffset - (window.innerHeight / 2) + 50;
         window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);

    setFullBibleData(prevData => {
       const bData = prevData[language];
       if (!bData || !bData[selectedBook] || !bData[selectedBook][selectedChapter]) return prevData;
       const textToRead = bData[selectedBook][selectedChapter][verseId];
       if (!textToRead) return prevData;

       const utterance = new SpeechSynthesisUtterance(textToRead);
       utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';
       utterance.rate = readSpeed;
       const voice = getBestVoice(language);
       if (voice) utterance.voice = voice;

       utterance.onstart = () => setAudioState('playing');
       utterance.onend = () => {
         const currentIndex = queue.indexOf(verseId);
         if (currentIndex >= 0 && currentIndex < queue.length - 1) {
            playVerseFallback(queue[currentIndex + 1], queue);
         } else {
            handleStopReading();
         }
       };
       utterance.onerror = (e) => {
         if (e.error === "interrupted" || e.error === "canceled") return;
         console.error("Speech error:", e);
         handleStopReading();
       };

       utteranceRef.current = utterance;
       setTimeout(() => window.speechSynthesis.speak(utterance), 100);
       return prevData;
    });
  }, [language, selectedBook, selectedChapter, readSpeed, getBestVoice, handleStopReading]);

  const handleStartReading = useCallback(async () => {
    if (!fullBibleData[language]) return;
    const vData = fullBibleData[language][selectedBook]?.[selectedChapter];
    if (!vData) return;
    
    let queue = [];
    if (selectedVerses.length > 0) {
      queue = [...selectedVerses].sort((a,b) => parseInt(a) - parseInt(b));
    } else {
      queue = Object.keys(vData).sort((a,b) => parseInt(a) - parseInt(b));
    }
    setReadingQueue(queue);
    setAudioState('generating');
    setCurrentReadingVerse(queue[0]);
    setUseFallback(false);

    const versesToSend = {};
    for (const vNum of queue) {
      versesToSend[vNum] = vData[vNum];
    }

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, book: selectedBook, chapter: selectedChapter, verses: versesToSend })
      });
      if (!response.ok) throw new Error('Cloud TTS Failed');
      const data = await response.json();
      const tsResponse = await fetch(data.timestampsUrl);
      const timestamps = await tsResponse.json();
      
      setAudioTimestamps(timestamps);
      setAudioUrl(data.audioUrl);
      
      // Auto-scroll to first verse immediately
      setTimeout(() => {
        const el = document.getElementById(`verse-${queue[0]}`);
        if (el) {
           const y = el.getBoundingClientRect().top + window.pageYOffset - (window.innerHeight / 2) + 50;
           window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);

    } catch (err) {
      console.warn("Cloud TTS Failed, falling back to Browser Speech", err);
      setUseFallback(true);
      playVerseFallback(queue[0], queue);
    }
  }, [fullBibleData, language, selectedBook, selectedChapter, selectedVerses, playVerseFallback]);

  useEffect(() => {
    if (audioUrl && audioRef.current && !useFallback) {
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = readSpeed;
      audioRef.current.play().then(() => {
        setAudioState('playing');
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: `${getBookName(selectedBook, language)} ${selectedChapter}`,
            artist: language === 'ta' ? 'தமிழ் வேதாகமம்' : 'Holy Bible',
            album: 'Church App',
          });
          navigator.mediaSession.setActionHandler('play', handlePauseResumeReading);
          navigator.mediaSession.setActionHandler('pause', handlePauseResumeReading);
          navigator.mediaSession.setActionHandler('previoustrack', handlePrevVerseReading);
          navigator.mediaSession.setActionHandler('nexttrack', handleNextVerseReading);
        }
      }).catch((e) => {
        console.error("Audio Playback Failed:", e);
        setUseFallback(true);
        playVerseFallback(readingQueue[0], readingQueue);
      });
    }
  }, [audioUrl, useFallback]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current || useFallback || audioTimestamps.length === 0) return;
    const currentTime = audioRef.current.currentTime;
    setAudioProgress(currentTime);
    setAudioDuration(audioRef.current.duration || 0);
    
    let activeVerse = null;
    for (const ts of audioTimestamps) {
      if (currentTime >= ts.start && currentTime <= ts.end) {
        activeVerse = ts.verseNum;
        break;
      }
    }
    if (activeVerse && activeVerse !== currentReadingVerse) {
      setCurrentReadingVerse(activeVerse);
      const el = document.getElementById(`verse-${activeVerse}`);
      if (el) {
         const y = el.getBoundingClientRect().top + window.pageYOffset - (window.innerHeight / 2) + 50;
         window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, [audioTimestamps, currentReadingVerse, useFallback]);

  const handlePauseResumeReading = useCallback(() => {
    if (useFallback) {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      if (audioState === 'paused') {
        window.speechSynthesis.resume();
        setAudioState('playing');
      } else {
        window.speechSynthesis.pause();
        setAudioState('paused');
      }
    } else {
      if (audioRef.current) {
        if (audioState === 'paused') {
          audioRef.current.play();
          setAudioState('playing');
        } else {
          audioRef.current.pause();
          setAudioState('paused');
        }
      }
    }
  }, [audioState, useFallback]);

  const handleNextVerseReading = useCallback(() => {
    if (!currentReadingVerse || readingQueue.length === 0) return;
    const currentIndex = readingQueue.indexOf(currentReadingVerse);
    if (currentIndex >= 0 && currentIndex < readingQueue.length - 1) {
       if (useFallback) {
         playVerseFallback(readingQueue[currentIndex + 1], readingQueue);
       } else {
         const nextVerseTs = audioTimestamps.find(ts => ts.verseNum === readingQueue[currentIndex + 1]);
         if (nextVerseTs && audioRef.current) {
           audioRef.current.currentTime = nextVerseTs.start;
           setCurrentReadingVerse(readingQueue[currentIndex + 1]);
         }
       }
    }
  }, [currentReadingVerse, readingQueue, useFallback, playVerseFallback, audioTimestamps]);

  const handlePrevVerseReading = useCallback(() => {
    if (!currentReadingVerse || readingQueue.length === 0) return;
    const currentIndex = readingQueue.indexOf(currentReadingVerse);
    if (currentIndex > 0) {
       if (useFallback) {
         playVerseFallback(readingQueue[currentIndex - 1], readingQueue);
       } else {
         const prevVerseTs = audioTimestamps.find(ts => ts.verseNum === readingQueue[currentIndex - 1]);
         if (prevVerseTs && audioRef.current) {
           audioRef.current.currentTime = prevVerseTs.start;
           setCurrentReadingVerse(readingQueue[currentIndex - 1]);
         }
       }
    }
  }, [currentReadingVerse, readingQueue, useFallback, playVerseFallback, audioTimestamps]);

  const cycleSpeed = useCallback(() => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(readSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setReadSpeed(nextSpeed);
    if (useFallback) {
      if (audioState === 'playing' || audioState === 'paused') {
        playVerseFallback(currentReadingVerse, readingQueue);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.playbackRate = nextSpeed;
      }
    }
  }, [readSpeed, audioState, useFallback, currentReadingVerse, readingQueue, playVerseFallback]);

  useEffect(() => {
    if (audioState !== 'idle') handleStopReading();
  }, [language, selectedChapter, selectedBook]);

  useEffect(() => {
    return () => handleStopReading();
  }, [handleStopReading]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  // --- End Audio Player State ---

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
       return [...prev, verseNum].sort((a,b) => parseInt(a) - parseInt(b));
    });
  }, []);

  const handleCopySelection = useCallback(() => {
    if (selectedVerses.length === 0) return;
    
    const verseRef = selectedVerses.length > 1 
      ? `${selectedVerses[0]}-${selectedVerses[selectedVerses.length-1]}`
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
      ? `${selectedVerses[0]}-${selectedVerses[selectedVerses.length-1]}`
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
      <div className={`hidden md:block ${bgToolbar} border-b ${borderCol} sticky top-[var(--navbar-height)] z-40 transition-colors duration-500`}>
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
                    ? 'border-gray-700 bg-gray-800 text-white focus:border-[#D4AF37]'
                    : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] focus:border-[#54091b] focus:bg-white placeholder-[#54091b]/40'
                  }`}
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(""); setIsSearchOpen(false); setDebouncedSearch(""); }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1 rounded-full ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-[#54091b]/50 hover:text-[#54091b] hover:bg-[#54091b]/10'}`}
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
                          className={`px-4 py-3 cursor-pointer transition-colors ${focusedResultIndex === idx ? (isDark ? 'bg-gray-700' : 'bg-[#54091b]/10') : (isDark ? 'hover:bg-gray-700/50' : 'hover:bg-[#54091b]/5')} ${idx !== searchResults.length - 1 ? (isDark ? 'border-b border-gray-700' : 'border-b border-[#E8DCCB]') : ''}`}
                        >
                          <div className={`text-xs font-bold mb-1 ${isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'}`}>
                            {getBookName(result.book, language)} {result.chapter}:{result.verseNum}
                          </div>
                          <div className={`text-sm font-serif line-clamp-2 ${isDark ? 'text-gray-300' : 'text-[#1E293B]'}`}>
                             {highlightText(result.text, debouncedSearch)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`px-4 py-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-[#54091b]/60'}`}>
                      No verses found.<br/>Try another word.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 ml-auto shrink-0">
                            {audioState === 'idle' ? (
                <button 
                  onClick={handleStartReading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors min-h-[44px] ${isDark ? 'bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30' : 'bg-[#54091b] text-white hover:bg-[#7A0F24] shadow-sm'}`}
                >
                  <Headphones size={18} />
                  <span className="hidden lg:inline">{selectedVerses.length > 0 ? "Listen Selected" : "Listen Chapter"}</span>
                  <span className="lg:hidden">Listen</span>
                </button>
              ) : audioState === 'generating' ? (
                <button 
                  disabled
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors min-h-[44px] ${isDark ? 'bg-gray-800 text-[#D4AF37]' : 'bg-[#F4EFE7] text-[#54091b]'}`}
                >
                  <Loader2 size={18} className="animate-spin" />
                  <span className="hidden lg:inline">Generating Audio...</span>
                  <span className="lg:hidden">Generating...</span>
                </button>
              ) : (
                <button 
                  onClick={handlePauseResumeReading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors min-h-[44px] ${isDark ? 'bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30' : 'bg-[#54091b] text-white hover:bg-[#7A0F24] shadow-sm'}`}
                >
                  {audioState === 'playing' ? <Pause size={18} /> : <Play size={18} />}
                  <span className="hidden lg:inline">{audioState === 'playing' ? "Pause" : "Resume"}</span>
                  <span className="lg:hidden">{audioState === 'playing' ? "Pause" : "Resume"}</span>
                </button>
              )}
              
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
                ? 'border-gray-700 bg-gray-800 text-white focus:border-[#D4AF37]'
                : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] focus:border-[#54091b] focus:bg-white placeholder-[#54091b]/40'
              }`}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); setIsSearchOpen(false); setDebouncedSearch(""); }}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1 rounded-full ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-[#54091b]/50 hover:text-[#54091b] hover:bg-[#54091b]/10'}`}
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
                      <div className={`text-sm font-serif line-clamp-2 ${isDark ? 'text-gray-300' : 'text-[#1E293B]'}`}>
                         {highlightText(result.text, debouncedSearch)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`px-4 py-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-[#54091b]/60'}`}>
                  No verses found.<br/>Try another word.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 3: Action Controls */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto resources-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {!isReading ? (
            <button 
              onClick={handleStartReading}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors min-w-[70px] min-h-[44px] shrink-0 ${isDark ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#54091b] text-white shadow-sm'}`}
            >
              <Volume2 size={16} />
              Read
            </button>
          ) : (
            <button 
              onClick={handleStopReading}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors min-w-[70px] min-h-[44px] shrink-0 ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700 shadow-sm'}`}
            >
              <Square size={16} fill="currentColor" />
              Stop
            </button>
          )}

          <button 
            onClick={toggleTheme} 
            aria-label="Toggle Theme"
            className={`p-2.5 rounded-xl transition-colors border-2 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center ${isDark ? 'border-gray-700 bg-gray-800 text-yellow-400 hover:border-gray-600' : 'border-[#54091b]/10 bg-[#F4EFE7] text-[#54091b] hover:border-[#54091b]/30'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className={`flex flex-1 items-center rounded-xl p-1 min-h-[44px] shrink-0 ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7] border border-[#54091b]/10'}`}>
            <button aria-label="Switch to Tamil" onClick={() => setLanguage("ta")} className={`flex-1 px-2 py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all duration-300 text-center min-w-[36px] ${language === "ta" ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400' : 'text-[#54091b]/60')}`}>TA</button>
            <button aria-label="Switch to English" onClick={() => setLanguage("en")} className={`flex-1 px-2 py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all duration-300 text-center min-w-[36px] ${language === "en" ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-[#54091b] shadow-sm') : (isDark ? 'text-gray-400' : 'text-[#54091b]/60')}`}>EN</button>
          </div>

          <div className={`flex flex-1 items-center rounded-xl p-1 min-h-[44px] shrink-0 ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7] border border-[#54091b]/10'}`}>
            <button aria-label="Decrease font size" onClick={() => setFontIndex(Math.max(0, fontIndex - 1))} disabled={fontIndex === 0} className={`flex-1 px-2 py-2 text-sm font-bold rounded-lg transition-all text-center flex justify-center items-center gap-1 ${isDark ? 'text-gray-300 hover:bg-gray-700 disabled:opacity-30' : 'text-[#54091b] hover:bg-white/50 disabled:opacity-30'}`}>A−</button>
            <div className={`w-px h-4 mx-0.5 ${isDark ? 'bg-gray-700' : 'bg-[#54091b]/20'}`}></div>
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
                    onToggleSelect={handleToggleSelect}
                    isSelected={highlightedVerseId === verseNum || selectedVerses.includes(verseNum)}
                    isReadingVerse={currentReadingVerse === verseNum}
                    showActions={selectedVerses.length > 0 && selectedVerses[selectedVerses.length - 1] === verseNum && !isReading}
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
      
      <ShareImageModal 
        isOpen={shareModalOpen} 
        onClose={() => setShareModalOpen(false)} 
        verseData={verseToShare} 
      />

      {/* Read Aloud Floating Mini Player */}
      {isReading && (
        <div className={`fixed bottom-0 left-0 right-0 z-[100] animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${isDark ? 'bg-gray-900 border-t border-gray-800' : 'bg-white border-t border-[#E8DCCB]'}`}>
          
          {/* Progress Bar (Visual Only) */}
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-800">
            <div 
              className="h-full bg-[#D4AF37] transition-all duration-300 ease-linear"
              style={{ width: `${((readingQueue.indexOf(currentReadingVerse) + 1) / (readingQueue.length || 1)) * 100}%` }}
            ></div>
          </div>
          
          <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 pb-safe">
            
            {/* Info */}
            <div className="flex items-center gap-3 overflow-hidden flex-1 sm:flex-none sm:w-[250px]">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-gray-800' : 'bg-[#F4EFE7]'}`}>
                 <Volume2 size={20} className={isDark ? 'text-[#D4AF37]' : 'text-[#54091b]'} />
              </div>
              <div className="flex flex-col truncate">
                 <span className={`text-sm font-bold truncate ${isDark ? 'text-gray-200' : 'text-[#54091b]'}`}>
                   {getBookName(selectedBook, language)} {selectedChapter}
                 </span>
                 <span className={`text-xs truncate ${isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37] font-semibold'}`}>
                   {t("Verse")} {currentReadingVerse}
                 </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-1 sm:gap-6 flex-none sm:flex-1">
              <button onClick={handlePrevVerseReading} disabled={readingQueue.indexOf(currentReadingVerse) <= 0} className={`p-2 transition-colors disabled:opacity-30 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#54091b]'}`}>
                <SkipBack size={24} fill="currentColor" />
              </button>
              
              <button onClick={handlePauseResumeReading} className={`p-3 sm:p-4 rounded-full transition-transform hover:scale-105 shadow-lg flex items-center justify-center ${isDark ? 'bg-white text-gray-900' : 'bg-[#54091b] text-white'}`}>
                {isPaused ? <Play size={20} fill="currentColor" className="ml-1" /> : <Pause size={20} fill="currentColor" />}
              </button>

              <button onClick={handleNextVerseReading} disabled={readingQueue.indexOf(currentReadingVerse) >= readingQueue.length - 1} className={`p-2 transition-colors disabled:opacity-30 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#54091b]'}`}>
                <SkipForward size={24} fill="currentColor" />
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center justify-end gap-1 sm:gap-4 flex-1 sm:flex-none sm:w-[250px]">
              <button onClick={cycleSpeed} className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors w-12 text-center ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-[#F4EFE7] text-[#54091b] hover:bg-[#E8DCCB]'}`}>
                {readSpeed}×
              </button>
              <button onClick={handleStopReading} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-gray-800' : 'text-red-600 hover:bg-red-50'}`}>
                <Square size={20} fill="currentColor" />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
