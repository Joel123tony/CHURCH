import React, { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import PdfViewerModal from "./PdfViewerModal";
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

export default function Books() {
  const { t, cmsData } = useLanguage();

  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
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

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase())
  );

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section id="books" className="py-16 bg-[#F4EFE7]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#54091b]">
              {cmsData?.books?.title || t("Books & Pamphlets")}
            </h2>
            {cmsData?.books?.subtitle && (
              <p className="mt-2 text-base text-[#1E293B]">
                {cmsData.books.subtitle}
              </p>
            )}
          </div>

          {/* Search Bar aligned to top-right on desktop */}
          <div className="w-full md:w-[280px] lg:w-[320px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-sm text-[#94A3B8]" />
            </div>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg py-2 pl-9 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee0039]/50 transition shadow-sm h-10 bg-[#FFFFFF] text-[#1E293B]"
              placeholder={cmsData?.books?.searchPlaceholder || t("Search by title...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {filteredBooks.length > 0 && (
              <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center pointer-events-none">
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                  {filteredBooks.length} {t("Books")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Books Container */}
        <div className="relative group/container">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-[#ee0039] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-10 text-sm font-medium opacity-80 text-[#1E293B]">
              {cmsData?.books?.emptyStateMessage || t("No books found matching your search.")}
            </div>
          ) : (
            <>
              {/* Navigation Arrows (Desktop) */}
              <button
                onClick={scrollLeft}
                className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-lg border border-gray-100 opacity-0 group-hover/container:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white text-[#54091b]"
              >
                <FaChevronLeft className="pr-1 text-lg" />
              </button>

              <button
                onClick={scrollRight}
                className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-lg border border-gray-100 opacity-0 group-hover/container:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white text-[#54091b]"
              >
                <FaChevronRight className="pl-1 text-lg" />
              </button>

              {/* Horizontal Scroll Area */}
              <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-4 sm:gap-5 pb-4 snap-x snap-mandatory hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0 scroll-smooth"
              >
                {filteredBooks.map((book) => (
                  <div
                    key={book._id}
                    onClick={() => setSelectedBook(book)}
                    className="snap-start shrink-0 w-[85vw] sm:w-[180px] md:w-[200px] lg:w-[220px] cursor-pointer"
                  >
                    {/* Book Card matching YouTube card style */}
                    <div
                      className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] border border-gray-100 flex flex-col h-full bg-[#F4EFE7]"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-3 sm:p-4 flex-1 flex flex-col bg-[#54091b]">
                        <h3 className="line-clamp-2 leading-snug text-base font-semibold !text-[#f4efe7]">
                          {book.title}
                        </h3>
                        {book.date && (
                          <p className="mt-1.5 opacity-80 text-xs text-[#f4efe7]">
                            {book.date}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
