import React, { useState, useEffect, useRef, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import PdfPage from "./PdfPage";
import { 
  FaChevronLeft, FaChevronRight, FaSearchPlus, FaSearchMinus, 
  FaExpand, FaCompress, FaDownload, FaExternalLinkAlt, FaTimes, FaExpandArrowsAlt
} from "react-icons/fa";

// Configure pdfjs worker using Vite's official asset URL resolution
// Check to ensure we only assign it once globally.
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.js",
    import.meta.url
  ).toString();
}

export default function PdfBookReader({ pdfUrl, title, downloadUrl, onClose }) {
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(1.414); // Default to A4 until loaded
  
  // Advanced Desktop Features
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const bookRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let localPdf = null;
    let loadingTask = null;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      
      try {
        loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
          withCredentials: false
        });
        
        const loadedPdf = await loadingTask.promise;
        localPdf = loadedPdf;
        
        // Dynamically calculate aspect ratio from the first page
        const firstPage = await loadedPdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.0 });
        const detectedRatio = viewport.height / viewport.width;
        
        if (isMounted) {
          setAspectRatio(detectedRatio);
          setPdf(loadedPdf);
          setNumPages(loadedPdf.numPages);
          setLoading(false);
        } else {
          loadedPdf.destroy();
        }
      } catch (err) {
        if (isMounted) {
          console.error("PdfBookReader Error loading PDF:", err);
          setError(`Failed to load PDF document: ${err.message || "Unknown error"}`);
          setLoading(false);
        }
      }
    };

    if (pdfUrl) {
      loadPdf();
    }

    return () => {
      isMounted = false;
      // Do not use loadingTask.destroy() here as it aggressively terminates the worker
      // during React 18 Strict Mode double-mounts.
      if (localPdf) {
        localPdf.destroy();
      }
    };
  }, [pdfUrl]);

  const onFlip = useCallback((e) => {
    setCurrentPage(e.data);
  }, []);

  const nextButtonClick = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  const prevButtonClick = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextButtonClick();
      if (e.key === "ArrowLeft") prevButtonClick();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Zoom functionality
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 1));
  const handleFitToPage = () => setZoomLevel(1);

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Responsive: single page on small screens
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-white font-bold tracking-wider uppercase text-sm">Loading Book...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900">
        <p className="text-red-400 font-bold mb-4">{error}</p>
        <a 
          href={pdfUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition"
        >
          Open PDF Natively
        </a>
      </div>
    );
  }

  // Responsive size calculations dynamically matching the PDF's exact aspect ratio
  const paddingX = isMobile ? 20 : 160; 
  const paddingY = isMobile ? 120 : 160; // Increased for top toolbar and bottom spacing

  const availableWidth = window.innerWidth - paddingX;
  const availableHeight = window.innerHeight - paddingY;

  // Decide pagesToShow based on available width vs aspect ratio
  let pagesToShow = isMobile ? 1 : 2;
  if (!isMobile) {
    const requiredTwoPageWidth = (availableHeight / aspectRatio) * 2;
    // If we require much more width than is available, comfortably drop to a single page
    if (requiredTwoPageWidth > availableWidth * 1.3) {
      pagesToShow = 1;
    }
  }

  let bookWidth = availableWidth;
  let bookHeight = (availableWidth / pagesToShow) * aspectRatio;

  // If the calculated height exceeds available height, constrain by height instead
  if (bookHeight > availableHeight) {
    bookHeight = availableHeight;
    bookWidth = (availableHeight / aspectRatio) * pagesToShow;
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full bg-slate-900 relative overflow-hidden">
      
      {/* Unified Premium Toolbar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 bg-slate-900 border-b border-white/10 shrink-0 z-50 shadow-md">
        <h2 className="text-white font-semibold text-base sm:text-lg md:text-xl truncate pr-4 max-w-full sm:max-w-[30%]">
          {title || "PDF Document"}
        </h2>
        
        {/* Desktop Paging Controls */}
        <div className="hidden md:flex items-center gap-4 bg-black/30 rounded-full px-4 py-1.5 border border-white/5 shadow-inner">
          <button 
            onClick={prevButtonClick} 
            disabled={currentPage === 0} 
            className="text-white/70 hover:text-white disabled:opacity-30 transition"
            title="Previous Page"
          >
            <FaChevronLeft size={16} />
          </button>
          <div className="text-white text-sm font-bold tracking-widest px-2">
            {currentPage + 1} / {numPages}
          </div>
          <button 
            onClick={nextButtonClick} 
            disabled={currentPage >= numPages - (isMobile ? 1 : pagesToShow)} 
            className="text-white/70 hover:text-white disabled:opacity-30 transition"
            title="Next Page"
          >
            <FaChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 mt-3 sm:mt-0">
          {/* Zoom Controls */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5 mr-2">
            <button onClick={handleZoomOut} disabled={zoomLevel <= 1} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded transition disabled:opacity-30" title="Zoom Out"><FaSearchMinus size={14}/></button>
            <button onClick={handleFitToPage} disabled={zoomLevel === 1} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded transition disabled:opacity-30" title="Fit to Page"><FaExpandArrowsAlt size={14}/></button>
            <button onClick={handleZoomIn} disabled={zoomLevel >= 3} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded transition disabled:opacity-30" title="Zoom In"><FaSearchPlus size={14}/></button>
          </div>

          <button onClick={toggleFullscreen} className="hidden md:flex p-2 sm:px-4 sm:py-2 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all items-center justify-center border border-white/5" title="Fullscreen">
             {isFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}
          </button>

          {downloadUrl && (
             <a href={downloadUrl} download className="text-white/80 hover:text-white bg-white/5 hover:bg-white/10 p-2 sm:px-4 sm:py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-white/5" title="Download PDF">
               <FaDownload size={14} />
               <span className="hidden lg:inline">Download</span>
             </a>
          )}
          {pdfUrl && (
             <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white bg-white/5 hover:bg-white/10 p-2 sm:px-4 sm:py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-white/5" title="Open in new tab">
               <FaExternalLinkAlt size={14} />
               <span className="hidden lg:inline">Open</span>
             </a>
          )}
          <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>
          {onClose && (
            <button onClick={onClose} className="text-white/80 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all flex items-center justify-center border border-transparent hover:border-red-500/20" title="Close">
              <FaTimes size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area with Zoom & Pan */}
      <div className="flex-1 relative w-full h-full overflow-auto custom-scrollbar flex items-center justify-center bg-slate-900 pt-4 pb-20 md:pb-10">
        
        {/* Floating Side Navigation Arrows (Desktop) */}
        <div className="absolute top-1/2 left-4 lg:left-10 z-10 -translate-y-1/2 hidden md:block">
          <button 
            onClick={prevButtonClick}
            disabled={currentPage === 0}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            title="Previous Page"
          >
            <FaChevronLeft size={20} />
          </button>
        </div>

        <div className="absolute top-1/2 right-4 lg:right-10 z-10 -translate-y-1/2 hidden md:block">
          <button 
            onClick={nextButtonClick}
            disabled={currentPage >= numPages - (isMobile ? 1 : pagesToShow)}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            title="Next Page"
          >
            <FaChevronRight size={20} />
          </button>
        </div>

        {/* Zoom Transform Wrapper */}
        <div 
          className="relative flex items-center justify-center transition-transform duration-300 origin-center"
          style={{ 
            width: `${bookWidth}px`, 
            height: `${bookHeight}px`,
            transform: `scale(${zoomLevel})`
          }}
        >
          <HTMLFlipBook
            width={bookWidth}
            height={bookHeight}
            size="stretch"
            minWidth={300}
            maxWidth={1600}
            minHeight={400}
            maxHeight={2000}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            useMouseEvents={zoomLevel === 1} // Disable drag-to-flip while zoomed for panning
            onFlip={onFlip}
            usePortrait={pagesToShow === 1}
            ref={bookRef}
            className="mx-auto shadow-2xl"
            style={{ margin: '0 auto' }}
          >
            {Array.from({ length: numPages }).map((_, i) => (
              <PdfPage 
                key={i} 
                pageNum={i + 1} 
                pdf={pdf} 
                currentPage={currentPage}
                isCover={i === 0 || i === numPages - 1} 
              />
            ))}
          </HTMLFlipBook>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[360px]">
          <div className="bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-between p-1.5 shadow-2xl border border-white/20">
            <button 
              onClick={prevButtonClick}
              disabled={currentPage === 0}
              className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              aria-label="Previous Page"
            >
              <FaChevronLeft size={16} />
            </button>
            
            <div className="text-sm font-bold tracking-widest px-4 truncate">
              {currentPage + 1} / {numPages}
            </div>
            
            <button 
              onClick={nextButtonClick}
              disabled={currentPage >= numPages - 1}
              className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              aria-label="Next Page"
            >
              <FaChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
