import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker using CDN to guarantee version match and avoid Netlify/Vite build issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Normalize Cloudinary raw PDF URLs.
 * Cloudinary stores PDFs with resource_type "raw", which may omit the .pdf extension.
 * pdfjs needs proper content-type detection — appending .pdf to the URL path ensures this.
 */
function normalizePdfUrl(url) {
  if (!url || typeof url !== "string") return url;
  
  // If it's a Cloudinary raw URL without .pdf extension, append it
  if (url.includes("/raw/upload/") && !url.toLowerCase().endsWith(".pdf")) {
    return url + ".pdf";
  }
  
  return url;
}

export default function PdfViewerModal({ isOpen, onClose, pdfUrl, title }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const bookRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft") bookRef.current?.pageFlip()?.flipPrev();
        if (e.key === "ArrowRight") bookRef.current?.pageFlip()?.flipNext();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen, onClose]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleRetry = (e) => {
    e.stopPropagation();
    setRetryKey(prev => prev + 1);
  };

  const onPage = (e) => {
    setPageNumber(e.data + 1); // e.data is the page index
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-[110]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white font-bold text-xl drop-shadow-md">{title}</h2>
        <button
          onClick={onClose}
          className="text-white bg-black/30 hover:bg-black/50 p-3 rounded-full transition"
        >
          <FaTimes size={24} />
        </button>
      </div>

      <div
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <Document
          key={retryKey}
          file={normalizePdfUrl(pdfUrl)}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="text-white flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
              Loading Book...
            </div>
          }
          error={
            <div className="text-white flex flex-col items-center bg-black/40 p-6 rounded-lg backdrop-blur">
              <div className="text-red-400 mb-2 font-semibold">Failed to load PDF.</div>
              <div className="text-sm text-gray-300 text-center mb-4 max-w-sm">
                The file may be unavailable, restricted, or corrupted. Please try again later.
              </div>
              <button 
                onClick={handleRetry}
                className="bg-white/10 hover:bg-white/20 border border-white/30 px-6 py-2 rounded-full transition-colors font-medium text-sm"
              >
                Retry
              </button>
            </div>
          }
          onLoadError={(error) => {
            console.error("PDF Viewer Error:", error);
            console.error("PDF URL Attempted:", pdfUrl);
          }}
        >
          {numPages && numPages === 1 ? (
            // SINGLE PAGE: Center and fit width
            <div className="flex items-center justify-center max-h-[80vh] overflow-auto shadow-2xl">
              <Page
                pageNumber={1}
                width={isMobile ? window.innerWidth - 32 : Math.min(window.innerWidth - 64, 800)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          ) : numPages && numPages > 1 ? (
            // MULTI PAGE: Realistic book reading experience
            <div className="flex items-center justify-center relative">
              <HTMLFlipBook
                width={isMobile ? window.innerWidth - 32 : 450}
                height={isMobile ? window.innerHeight - 150 : 650}
                size="fixed"
                minWidth={315}
                maxWidth={1000}
                minHeight={400}
                maxHeight={1533}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                className="shadow-2xl bg-white"
                ref={bookRef}
                onFlip={onPage}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <div key={`page_${index + 1}`} className="bg-white overflow-hidden flex items-center justify-center">
                    <Page
                      pageNumber={index + 1}
                      width={isMobile ? window.innerWidth - 32 : 450}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>
                ))}
              </HTMLFlipBook>

              {/* Navigation Arrows (Desktop) */}
              {!isMobile && (
                <>
                  <button
                    onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                    className="absolute left-[-60px] top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition p-4 hover:bg-black/20 rounded-full"
                    disabled={pageNumber <= 1}
                  >
                    <FaChevronLeft size={40} />
                  </button>
                  <button
                    onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                    className="absolute right-[-60px] top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition p-4 hover:bg-black/20 rounded-full"
                    disabled={pageNumber >= numPages}
                  >
                    <FaChevronRight size={40} />
                  </button>
                </>
              )}
            </div>
          ) : null}
        </Document>

        {/* Page Counter */}
        {numPages > 1 && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full font-semibold backdrop-blur text-sm z-[110]"
            onClick={(e) => e.stopPropagation()}
          >
            {pageNumber} / {numPages}
          </div>
        )}
      </div>
    </div>
  );
}
