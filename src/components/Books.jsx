import { useState, useEffect, useRef, useMemo } from "react";
import API from "../api/axios";
import PdfViewerModal from "./PdfViewerModal";
import { FaSearch, FaChevronLeft, FaChevronRight, FaTimes, FaCalendarAlt, FaFilePdf } from "react-icons/fa";
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

          {/* Modern Filter Bar */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
            
            {/* Search */}
            <div className="relative w-full sm:w-48 md:w-56">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-sm text-[#94A3B8]" />
              </div>
              <input
                type="text"
                className="w-full bg-white border-2 border-[#E8DCCB] rounded-2xl py-3 pl-10 pr-4 text-base focus:outline-none focus:border-[#54091b] transition-all shadow-sm text-slate-900 placeholder-slate-400 font-medium"
                placeholder={t("Search Books...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Month Picker */}
            <div className="relative w-full sm:w-36">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white border-2 border-[#E8DCCB] rounded-2xl py-3 px-4 text-base focus:outline-none focus:border-[#54091b] transition-all shadow-sm text-slate-900 appearance-none cursor-pointer font-medium"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="text-xs text-[#94A3B8]" />
              </div>
            </div>

            {/* Year Picker */}
            <div className="relative w-full sm:w-32">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-white border-2 border-[#E8DCCB] rounded-2xl py-3 px-4 text-base focus:outline-none focus:border-[#54091b] transition-all shadow-sm text-slate-900 appearance-none cursor-pointer font-medium"
              >
                <option value="">All Years</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="text-xs text-[#94A3B8]" />
              </div>
            </div>

            {/* Clear Filters */}
            {(search || selectedMonth || selectedYear) && (
              <button
                onClick={clearFilters}
                className="w-full sm:w-auto px-6 py-3 text-base font-bold text-[#54091b] bg-white border-2 border-[#E8DCCB] hover:bg-[#F8F4EC] rounded-2xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <FaTimes className="text-sm" />
                {t("Clear")}
              </button>
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

              {/* Horizontal Scroll Area */}
              <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-5 sm:gap-6 pb-8 pt-4 snap-x snap-mandatory resources-scrollbar scroll-smooth"
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
