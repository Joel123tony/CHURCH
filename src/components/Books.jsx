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

  const availableYears = useMemo(() => {
    const years = new Set();
    books.forEach(book => {
      if (book.date) {
        const y = new Date(book.date).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
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

  const filterChipText = useMemo(() => {
    if (!selectedMonth && !selectedYear) return null;
    const m = MONTHS.find(m => m.value === selectedMonth)?.label || "";
    const y = selectedYear || "";
    if (m && y) return `${m} ${y}`;
    return m || y;
  }, [selectedMonth, selectedYear]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'long' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <section id="books" className="py-16 bg-[#F4EFE7]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

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
            <div className="relative px-2 sm:px-12 md:px-16">
              {/* Navigation Arrows (Desktop) */}
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-[#F6EFE3] text-[#54091b] shadow-xl border border-gray-200 opacity-0 group-hover/container:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white"
              >
                <FaChevronLeft className="pr-1 text-lg" />
              </button>

              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-[#F6EFE3] text-[#54091b] shadow-xl border border-gray-200 opacity-0 group-hover/container:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white"
              >
                <FaChevronRight className="pl-1 text-lg" />
              </button>

              {/* Swipe Indicator (Animated Hint) */}
              {!hasScrolled && filteredBooks.length > 1 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none transition-opacity duration-500 opacity-100 flex flex-col items-center">
                  <div className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 animate-bounce-horizontal shadow-lg">
                    <span className="hidden sm:inline">← Scroll →</span>
                    <span className="sm:hidden">← Swipe →</span>
                  </div>
                </div>
              )}

              {/* Horizontal Scroll Area */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto gap-5 sm:gap-6 pb-8 pt-4 snap-x snap-mandatory resources-scrollbar scroll-smooth relative z-10"
              >
                {filteredBooks.map((book) => (
                  <div
                    key={book._id}
                    onClick={() => setSelectedBook(book)}
                    className="snap-center shrink-0 w-[85vw] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] cursor-pointer"
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
                      <div className="p-4 sm:p-5 flex-1 flex flex-col bg-[#54091b]/95 backdrop-blur-sm group-hover/card:bg-[#5f0a1e] transition-colors duration-300 relative z-10 border-t border-[#D4AF37]/10">
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
                        
                        <div className="mt-auto pt-4 flex items-center justify-between text-xs sm:text-sm font-medium">
                          {book.date ? (
                            <span className="flex items-center text-[#D4AF37]/90">
                              <span className="mr-1.5">📅</span> {formatDate(book.date)}
                            </span>
                          ) : (
                            <span></span>
                          )}
                          <span className="flex items-center text-[#F6EFE3]/80 bg-[#F6EFE3]/10 px-2 py-1 rounded-md">
                            <FaFilePdf className="mr-1.5 text-xs text-[#D4AF37]" /> PDF
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
