import { useState, useEffect, useRef, useMemo } from "react";
import API from "../api/axios";
import PdfViewerModal from "./PdfViewerModal";
import { FaChevronLeft, FaChevronRight, FaFilePdf } from "react-icons/fa";
import { Search, CalendarDays, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const MONTHS = [
  { value: "", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function Books() {
  const { t } = useLanguage();

  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const scrollContainerRef = useRef(null);
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const datePickerRef = useRef(null);
  
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const mobileScrollRef = useRef(null);
  
  const [isArchiveView, setIsArchiveView] = useState(false);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await API.get("/books");
        setBooks(res.data.books || []);
      } catch (err) {
        console.error("Failed to fetch books", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const trimmed = dateString.trim();
    // If it's exactly 4 digits, just return it
    if (/^\d{4}$/.test(trimmed)) return trimmed;
    
    const d = new Date(trimmed);
    if (isNaN(d)) return trimmed; // Fallback to exact raw string
    
    const options = { year: 'numeric', month: 'long' };
    return d.toLocaleDateString(undefined, options);
  };

  const availableYears = useMemo(() => {
    const years = new Set();
    books.forEach(book => {
      if (book.date) {
        const d = new Date(book.date);
        if (!isNaN(d)) {
          years.add(d.getFullYear());
        } else {
          const match = book.date.match(/\d{4}/);
          if (match) years.add(parseInt(match[0], 10));
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [books]);

  const archiveGroups = useMemo(() => {
    const groups = {};
    const sorted = [...books].sort((a, b) => {
      const getVal = (dStr) => {
         if (!dStr) return 0;
         const d = new Date(dStr);
         if (!isNaN(d)) return d.getTime();
         const m = dStr.match(/\d{4}/);
         return m ? new Date(m[0], 0, 1).getTime() : 0;
      };
      return getVal(b.date) - getVal(a.date);
    });
    
    sorted.forEach(book => {
      let key = "Older";
      if (book.date) {
        key = formatDate(book.date);
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(book);
    });
    return groups;
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const titleMatch = book.title.toLowerCase().includes(search.toLowerCase());
      
      let monthMatch = true;
      let yearMatch = true;
      
      if (selectedMonth || selectedYear) {
        if (!book.date) {
          monthMatch = !selectedMonth;
          yearMatch = !selectedYear;
        } else {
          const d = new Date(book.date);
          const m = d.getMonth() + 1;
          const y = d.getFullYear();
          
          if (selectedMonth) {
            monthMatch = (m === parseInt(selectedMonth));
          }
          if (selectedYear) {
            yearMatch = (y === parseInt(selectedYear));
          }
        }
      }
      
      return titleMatch && monthMatch && yearMatch;
    });
  }, [books, search, selectedMonth, selectedYear]);

  const clearFilters = () => {
    setSearch("");
    setSelectedMonth("");
    setSelectedYear("");
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!hasScrolled) setHasScrolled(true);
  };

  const clearDateFilters = (e) => {
    if (e) e.stopPropagation();
    setSelectedMonth("");
    setSelectedYear("");
  };

  const handleMobileScroll = (e) => {
    if (!mobileScrollRef.current) return;
    const scrollLeft = e.target.scrollLeft;
    const itemWidth = e.target.clientWidth;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex !== activeMobileIndex) {
      setActiveMobileIndex(newIndex);
    }
  };

  const scrollToMobileIndex = (index) => {
    if (mobileScrollRef.current) {
      const itemWidth = mobileScrollRef.current.clientWidth;
      mobileScrollRef.current.scrollTo({
        left: itemWidth * index,
        behavior: 'smooth'
      });
      setActiveMobileIndex(index);
    }
  };

  const filterChipText = useMemo(() => {
    if (!selectedMonth && !selectedYear) return null;
    const m = MONTHS.find(m => m.value === selectedMonth)?.label || "";
    const y = selectedYear || "";
    if (m && y) return `${m} ${y}`;
    return m || y;
  }, [selectedMonth, selectedYear]);



  return (
    <section id="books" className="py-16 bg-[#F4EFE7]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

        {isArchiveView ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header for Archive */}
            <div className="flex items-center gap-4 mb-10 sm:mb-14 sticky top-[70px] sm:top-[80px] z-30 bg-[#F4EFE7]/95 backdrop-blur-md py-4 -mx-5 px-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-[#E8DCCB] shadow-sm">
              <button 
                onClick={() => {
                  setIsArchiveView(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-[#E8DCCB] text-[#54091b] hover:bg-[#54091b] hover:text-white transition-all duration-300"
              >
                <FaChevronLeft className="pr-1 text-sm sm:text-lg" />
              </button>
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#54091b]">
                  {t("Publication Archive")}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-[#54091b]/60 mt-0.5">
                  {books.length} {t("items in library")}
                </p>
              </div>
            </div>

            {/* Archive Content */}
            <div className="flex flex-col gap-12 sm:gap-16 pb-12">
              {Object.entries(archiveGroups).map(([groupDate, groupBooks]) => (
                <div key={groupDate}>
                  <h3 className="text-xl sm:text-2xl font-black text-[#54091b] mb-4 sm:mb-6 px-1 tracking-tight">
                    {groupDate}
                  </h3>
                  {/* Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 px-1">
                    {groupBooks.map(book => (
                      <div 
                        key={book._id}
                        onClick={() => setSelectedBook(book)}
                        className="group/archive flex flex-col cursor-pointer"
                      >
                        <div className="relative aspect-[3/4] w-full rounded-[14px] overflow-hidden bg-white shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-[#E8DCCB] group-hover/archive:shadow-[0_12px_30px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover/archive:-translate-y-1.5 flex items-center justify-center p-3 sm:p-4">
                          <img 
                            src={book.coverImageUrl} 
                            alt={book.title} 
                            loading="lazy"
                            className="w-full h-full object-contain group-hover/archive:scale-[1.03] transition-transform duration-500 ease-out"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/archive:bg-black/5 transition-colors duration-300 pointer-events-none rounded-[14px]"></div>
                        </div>
                        <div className="mt-3.5 px-1 flex flex-col items-start text-left">
                          <h4 className="text-sm sm:text-base font-bold text-[#54091b] line-clamp-2 leading-snug group-hover/archive:text-[#D4AF37] transition-colors">
                            {book.title}
                          </h4>
                          <span className="inline-block mt-2 text-[10px] sm:text-[11px] font-extrabold text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-2 py-0.5 rounded">
                            {book.category || "Pamphlet"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-[#54091b]">
              {t("Books & Pamphlets")}
            </h2>
            
          </div>

          {/* Modern Premium Search & Filter Bar */}
          <div className="flex w-full xl:w-auto relative" ref={datePickerRef}>
            <div className="relative w-full xl:w-[480px] h-[56px] flex items-center bg-white rounded-[18px] border border-[#E5D7C4] shadow-sm transition-all duration-250 focus-within:border-[#7A0F24] focus-within:ring-4 focus-within:ring-[rgba(122,15,36,0.08)]">
              
              {/* Search Icon */}
              <div className="pl-4 pr-3 flex items-center justify-center shrink-0">
                <Search className="text-[#9CA3AF] w-5 h-5" />
              </div>

              {/* Search Input */}
              <input
                type="text"
                className="flex-1 h-full bg-transparent border-none outline-none text-base text-slate-900 placeholder-[#9CA3AF] font-medium min-w-0"
                placeholder={t("Search Books...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* Selected Filter Chip */}
              {filterChipText && (
                <div className="hidden sm:flex items-center bg-[#F8EFD9] text-[#5B0E21] rounded-full px-3 py-1.5 mx-2 shrink-0 text-sm font-semibold whitespace-nowrap">
                  {filterChipText}
                  <button 
                    onClick={clearDateFilters}
                    className="ml-2 hover:bg-[#E5D7C4] rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {filterChipText && (
                <div className="sm:hidden flex items-center bg-[#F8EFD9] text-[#5B0E21] rounded-full px-2 py-1 mx-1 shrink-0 text-xs font-semibold overflow-hidden max-w-[100px]">
                  <span className="truncate">{filterChipText}</span>
                  <button 
                    onClick={clearDateFilters}
                    className="ml-1 hover:bg-[#E5D7C4] rounded-full p-0.5 shrink-0 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Calendar Button */}
              <div className="pr-2 pl-1 shrink-0">
                <button
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="w-10 h-10 flex items-center justify-center text-[#7A0F24] hover:bg-[rgba(122,15,36,0.08)] rounded-[10px] transition-all duration-250 hover:scale-[1.08]"
                >
                  <CalendarDays className="w-5 h-5" />
                </button>
              </div>

            </div>

            {/* Date Picker Popover */}
            {isDatePickerOpen && (
              <div className="absolute top-[64px] right-0 z-50 bg-white rounded-2xl shadow-xl border border-[#E5D7C4] p-4 w-72 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-bold text-[#5B0E21] uppercase tracking-wider">{t("Filter by Date")}</h4>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-500">{t("Month")}</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full bg-[#F4EFE7] border border-transparent rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-[#7A0F24] text-slate-900 font-medium cursor-pointer transition-colors"
                    >
                      {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-500">{t("Year")}</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full bg-[#F4EFE7] border border-transparent rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-[#7A0F24] text-slate-900 font-medium cursor-pointer transition-colors"
                    >
                      <option value="">All Years</option>
                      {availableYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mt-2 pt-3 border-t border-gray-100 flex justify-end">
                    <button 
                      onClick={() => setIsDatePickerOpen(false)}
                      className="px-4 py-2 bg-[#7A0F24] hover:bg-[#5B0E21] text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      {t("Apply")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Books Container */}
        <div className="relative group/container mt-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-10 h-10 border-4 border-[#54091b] border-t-[#D4AF37] rounded-full animate-spin"></div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-5xl mb-4">📚</span>
              <h3 className="text-xl font-bold text-[#54091b] mb-2">{t("No books found")}</h3>
              <p className="text-sm font-medium opacity-80 text-[#1E293B]">
                {t("Try selecting another month, year, or clearing your filters.")}
              </p>
              {(search || selectedMonth || selectedYear) && (
                <button
                  onClick={clearFilters}
                  className="mt-6 px-6 py-2 bg-[#54091b] text-[#F6EFE3] rounded-full font-medium hover:bg-[#5f0a1e] hover:shadow-lg transition-all duration-300"
                >
                  {t("Clear Filters")}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP VIEW */}
              <div className="hidden md:block relative px-12 md:px-16">
                {/* Navigation Arrows (Desktop) */}
                <button
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-[#F6EFE3] text-[#54091b] shadow-xl border border-gray-200 opacity-0 group-hover/container:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white"
                >
                  <FaChevronLeft className="pr-1 text-lg" />
                </button>

                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-[#F6EFE3] text-[#54091b] shadow-xl border border-gray-200 opacity-0 group-hover/container:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white"
                >
                  <FaChevronRight className="pl-1 text-lg" />
                </button>

                {/* Swipe Indicator (Animated Hint) */}
                {!hasScrolled && filteredBooks.length > 1 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none transition-opacity duration-500 opacity-100 flex flex-col items-center">
                    <div className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 animate-bounce-horizontal shadow-lg">
                      <span>← Scroll →</span>
                    </div>
                  </div>
                )}

                {/* Horizontal Scroll Area */}
                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="flex overflow-x-auto gap-6 pb-8 pt-4 snap-x snap-mandatory resources-scrollbar scroll-smooth relative z-10"
                >
                  {filteredBooks.map((book) => (
                    <div
                      key={book._id}
                      onClick={() => setSelectedBook(book)}
                      className="snap-start shrink-0 w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] cursor-pointer"
                    >
                      {/* Premium Book Card */}
                      <div
                        className="group/card rounded-[20px] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_-4px_rgba(84,9,27,0.15)] transition-all duration-300 hover:-translate-y-1.5 border border-[#E8DCCB] flex flex-col h-full bg-[#F4EFE7] relative"
                      >
                        {/* Inner border glow effect */}
                        <div className="absolute inset-0 rounded-[20px] ring-2 ring-transparent group-hover/card:ring-[#D4AF37]/50 transition-all duration-300 z-20 pointer-events-none"></div>
                        
                        <div className="relative aspect-[3/4] overflow-hidden bg-gray-200 shadow-inner">
                          <img
                            src={book.coverImageUrl}
                            alt={book.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                          />
                          {/* Subtle overlay for better depth */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Glass-style Footer */}
                        <div className="p-5 flex-1 flex flex-col bg-[#54091b]/95 backdrop-blur-sm group-hover/card:bg-[#5f0a1e] transition-colors duration-300 relative z-10 border-t border-[#D4AF37]/10">
                          <div 
                            role="heading" 
                            aria-level="3"
                            className="line-clamp-2 book-title"
                          >
                            {book.title}
                          </div>
                          
                          {book.author && (
                            <p className="mt-1.5 opacity-90 text-sm font-medium text-[#F6EFE3]">
                              {book.author}
                            </p>
                          )}
                          
                          <div className="mt-auto pt-4 flex items-center justify-between text-sm font-medium">
                            {book.date ? (
                              <span className="flex items-center text-[#D4AF37]/90">
                                <span className="mr-1.5">📅</span> {formatDate(book.date)}
                              </span>
                            ) : (
                              <span></span>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-2 py-1 rounded-md">
                                {book.category || "Pamphlet"}
                              </span>
                              <span className="flex items-center text-[#F6EFE3]/80 bg-[#F6EFE3]/10 px-2 py-1 rounded-md">
                                <FaFilePdf className="mr-1.5 text-xs text-[#D4AF37]" /> PDF
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MOBILE VIEW (Carousel) */}
              <div className="md:hidden relative w-full overflow-hidden flex flex-col items-center">
                {/* Navigation Arrows */}
                <button 
                  onClick={() => scrollToMobileIndex(Math.max(0, activeMobileIndex - 1))} 
                  disabled={activeMobileIndex === 0}
                  className="absolute left-2 top-[35%] -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/95 text-[#54091b] shadow-[0_4px_15px_rgba(0,0,0,0.15)] disabled:opacity-0 transition-opacity duration-300 border border-[#E8DCCB]"
                >
                  <FaChevronLeft className="pr-0.5 text-lg" />
                </button>
                <button 
                  onClick={() => scrollToMobileIndex(Math.min(filteredBooks.length - 1, activeMobileIndex + 1))} 
                  disabled={activeMobileIndex === filteredBooks.length - 1 || filteredBooks.length === 0}
                  className="absolute right-2 top-[35%] -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/95 text-[#54091b] shadow-[0_4px_15px_rgba(0,0,0,0.15)] disabled:opacity-0 transition-opacity duration-300 border border-[#E8DCCB]"
                >
                  <FaChevronRight className="pl-0.5 text-lg" />
                </button>

                {/* Carousel track */}
                <div 
                  ref={mobileScrollRef}
                  onScroll={handleMobileScroll}
                  className="flex overflow-x-auto snap-x snap-mandatory w-full hide-scrollbar scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {filteredBooks.map((book, idx) => {
                    const isActive = activeMobileIndex === idx;
                    return (
                      <div key={book._id} className="w-full shrink-0 snap-center flex flex-col items-center px-10 py-6">
                        {/* Book Cover */}
                        <div 
                          onClick={() => setSelectedBook(book)}
                          className={`relative cursor-pointer transition-all duration-500 ease-out flex justify-center items-center ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-40'}`}
                          style={{ width: '240px', height: '340px' }}
                        >
                          <img 
                            src={book.coverImageUrl} 
                            alt={book.title} 
                            className="w-full h-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.2)] rounded-md"
                          />
                        </div>
                        {/* Book Details */}
                        <div className={`mt-8 text-center transition-all duration-500 max-w-[260px] ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                          <h3 className="text-2xl font-black text-[#54091b] mb-2 leading-tight">{book.title}</h3>
                          <div className="flex items-center justify-center gap-2 text-[15px] font-semibold text-[#54091b]/70 tracking-wide uppercase">
                            {book.date && <span>{formatDate(book.date)}</span>}
                            {book.date && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>}
                            <span>{book.category || "Pamphlet"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Dots */}
                {filteredBooks.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-2 pb-4">
                    {filteredBooks.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={() => scrollToMobileIndex(idx)}
                        className={`transition-all duration-300 rounded-full ${activeMobileIndex === idx ? 'w-8 h-2 bg-[#D4AF37]' : 'w-2 h-2 bg-[#54091b]/20'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* View All Button */}
        <div className="mt-14 sm:mt-16 flex justify-center pb-4">
          <button 
            onClick={() => {
              setIsArchiveView(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group relative inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-5 bg-[#54091b] text-[#F6EFE3] rounded-full font-bold text-base sm:text-lg shadow-[0_8px_20px_rgba(84,9,27,0.2)] hover:shadow-[0_12px_25px_rgba(84,9,27,0.3)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <span className="relative z-10">{t("View All Books & Pamphlets")}</span>
            <FaChevronRight className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#7a0f24] to-[#54091b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        </div>
        )}
      </div>

      <PdfViewerModal
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        pdfUrl={selectedBook?.pdfUrl}
        title={selectedBook?.title}
      />
    </section>
  );
}
