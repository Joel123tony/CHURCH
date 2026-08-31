import { useState, useEffect, useRef, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import PdfPage from "./PdfPage";
import { ZoomIn, ZoomOut, Download, ExternalLink, X, ArrowLeft } from "lucide-react";

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
  const [aspectRatio, setAspectRatio] = useState(0.707); // Default to A4 portrait (width/height)
  const [pageDims, setPageDims] = useState({ width: 595, height: 842 }); // Default A4 points

  // Advanced Desktop Features
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0, pointerId: null });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const bookRef = useRef(null);
  const containerRef = useRef(null);
  const mainAreaRef = useRef(null);

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
        const detectedRatio = viewport.width / viewport.height;

        if (isMounted) {
          setAspectRatio(detectedRatio);
          setPageDims({ width: viewport.width, height: viewport.height });
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

  // Zoom functionality (75%, 90%, 100%, 125%, 150%, 175%, 200%, 250%, 300%)
  const ZOOM_LEVELS = [0.75, 0.9, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

  const handleZoomIn = () => {
    setZoomLevel(prev => {
      // Find current or next higher zoom
      const idx = ZOOM_LEVELS.findIndex(z => z > prev - 0.01);
      return idx < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[idx + 1] : prev;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      // Find current or next lower zoom
      let idx = ZOOM_LEVELS.findIndex(z => z > prev - 0.01);
      if (idx === -1) idx = ZOOM_LEVELS.length - 1;
      return idx > 0 ? ZOOM_LEVELS[idx - 1] : prev;
    });
  };

  const handleFitToPage = () => setZoomLevel(1);

  // Reset pan when returning to 1x zoom
  useEffect(() => {
    if (zoomLevel <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Pan handlers
  const handlePointerDown = (e) => {
    if (zoomLevel <= 1 || isDragging) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      pointerId: e.pointerId
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || zoomLevel <= 1 || e.pointerId !== dragStart.current.pointerId) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    let newX = dragStart.current.panX + dx;
    let newY = dragStart.current.panY + dy;

    if (mainAreaRef.current) {
      const containerWidth = mainAreaRef.current.clientWidth;
      const containerHeight = mainAreaRef.current.clientHeight;
      
      const scaledWidth = targetWidth * zoomLevel;
      const scaledHeight = targetHeight * zoomLevel;
      
      const maxPanX = Math.max(0, (scaledWidth - containerWidth) / 2);
      const maxPanY = Math.max(0, (scaledHeight - containerHeight) / 2);
      
      newX = Math.max(-maxPanX, Math.min(maxPanX, newX));
      newY = Math.max(-maxPanY, Math.min(maxPanY, newY));
    }

    setPan({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (e.pointerId === dragStart.current.pointerId) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Mobile fixes for Download and Open PDF
  const handleMobileDownload = async (e) => {
    e.preventDefault();
    if (!downloadUrl) return;
    try {
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = title ? `${title}.pdf` : "document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Download fallback failed", err);
      window.open(downloadUrl, '_blank');
    }
  };

  const handleOpenPdf = (e) => {
    e.preventDefault();
    if (!pdfUrl) return;
    try {
      const newWin = window.open(pdfUrl, '_blank');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        window.location.href = pdfUrl;
      }
    } catch (err) {
      window.location.href = pdfUrl;
    }
  };

  // Responsive: exact dimensions for flawless Fit-to-Viewport scaling
  const [windowDims, setWindowDims] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
        setWindowDims({ width: window.innerWidth, height: window.innerHeight });
      }, 50);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full w-full rounded-[28px]"
        style={{
          background: 'linear-gradient(180deg, #5B0E21 0%, #651126 45%, #4A0919 100%)',
          border: '1px solid rgba(212,175,55,.18)',
          boxShadow: '0 20px 60px rgba(0,0,0,.25)'
        }}
      >
        <span className="text-5xl mb-4 animate-bounce">📖</span>
        <p className="text-[#F4EFE7] font-bold text-lg mb-1">Loading Book...</p>
        <p className="text-[#D4AF37] font-medium opacity-80 text-sm">Please wait...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full w-full rounded-[28px]"
        style={{
          background: 'linear-gradient(180deg, #5B0E21 0%, #651126 45%, #4A0919 100%)',
          border: '1px solid rgba(212,175,55,.18)',
          boxShadow: '0 20px 60px rgba(0,0,0,.25)'
        }}
      >
        <p className="text-[#F4EFE7] font-bold text-lg mb-6">Unable to load this book.</p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#F4EFE7] text-[#5B0E21] rounded-full font-bold hover:bg-white transition"
          >
            Retry
          </button>
          <button
            onClick={handleOpenPdf}
            className="px-6 py-2 bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] rounded-full font-bold hover:bg-[#D4AF37]/10 transition"
          >
            Open PDF
          </button>
          <button
            onClick={handleMobileDownload}
            className="px-6 py-2 bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] rounded-full font-bold hover:bg-[#D4AF37]/10 transition"
          >
            Download
          </button>
        </div>
      </div>
    );
  }

  // Responsive size calculations dynamically matching the PDF's exact aspect ratio
  let availableWidth = windowDims.width;
  let availableHeight = windowDims.height;

  if (isMobile) {
    availableHeight -= (70 + 64 + 100); // Header, Toolbar, Bottom Nav/Padding
    availableWidth -= 32; // Minimal side margins
  } else {
    // Desktop: Keep generous margins to ensure entire page is comfortably visible
    availableHeight -= (70 + 44 + 80); // Header, Footer, + 80px extra vertical breathing room
    availableWidth -= 160; // 80px extra horizontal margin on each side
  }

  let pagesToShow = isMobile ? 1 : 2;
  if (!isMobile) {
    const requiredTwoPageWidth = availableHeight * aspectRatio * 2;
    // Comfortably drop to a single page if two pages would require too much width
    if (requiredTwoPageWidth > availableWidth * 1.3) {
      pagesToShow = 1;
    }
  }

  const bookRatio = aspectRatio * pagesToShow;

  // Calculate perfectly fitted pixel dimensions to prevent ANY vertical scrolling
  let targetHeight = availableHeight;
  let targetWidth = targetHeight * bookRatio;

  if (targetWidth > availableWidth) {
    targetWidth = availableWidth;
    targetHeight = targetWidth / bookRatio;
  }

  // Logic to prevent artificial blank spaces
  const isTwoPage = !isMobile && pagesToShow === 2 && numPages > 1;

  let xShift = "0%";
  if (isTwoPage) {
    if (currentPage === 0) {
      xShift = "-25%"; // Center the right-aligned cover
    } else if (currentPage === numPages - 1 && numPages % 2 === 0) {
      xShift = "25%"; // Center the left-aligned back cover
    }
  }

  // Prevent navigation to artificially generated blank back covers
  let maxPageIdx = numPages - 1;
  if (isTwoPage) {
    maxPageIdx = numPages % 2 === 0 ? numPages - 1 : Math.max(0, numPages - 2);
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full relative overflow-hidden animate-in fade-in duration-300"
      style={{
        background: 'linear-gradient(180deg, #5B0E21 0%, #651126 45%, #4A0919 100%)',
      }}
    >

      {/* Header: 70px */}
      <div
        className="w-full h-[70px] shrink-0 flex items-center justify-between px-4 sm:px-6 z-50"
        style={{
          background: '#5B0E21',
          borderBottom: '1px solid rgba(212,175,55,0.15)'
        }}
      >
        <div className="flex items-center flex-1 overflow-hidden">
          {onClose && (
            <button
              onClick={onClose}
              className="mr-4 text-[#F4EFE7] hover:text-[#D4AF37] transition flex items-center gap-2 font-bold shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <h2 className="text-[#F4EFE7] font-bold text-lg truncate pr-4" title={title}>
            {title || "PDF Document"}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[#D4AF37] font-medium text-sm whitespace-nowrap hidden md:block">
            Page {currentPage + 1} / {numPages}
          </div>
          {onClose && !isMobile && (
            <button onClick={onClose} className="w-[40px] h-[40px] rounded-full flex items-center justify-center bg-white/5 hover:bg-[#7A0F24] text-[#F4EFE7] transition-all duration-250 shrink-0" title="Close">
              <X className="w-5 h-5" />
            </button>
          )}
          {onClose && isMobile && (
            <button onClick={onClose} className="w-[44px] h-[44px] rounded-xl flex items-center justify-center bg-white/10 hover:bg-[#7A0F24] text-[#F4EFE7] transition-all duration-250 shrink-0" title="Close">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className={`w-full flex items-center justify-center shrink-0 z-50 ${isMobile ? 'h-[64px]' : 'absolute top-[90px] left-1/2 -translate-x-1/2 w-auto pointer-events-none'}`}>
        <div
          className={`flex items-center ${isMobile ? 'gap-2 w-full px-4 h-full' : 'gap-1 shadow-2xl rounded-full px-2 py-1.5 pointer-events-auto transition-transform hover:-translate-y-[2px]'}`}
          style={isMobile ? {
            background: 'rgba(122,15,36,0.85)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid rgba(212,175,55,0.18)'
          } : {
            background: 'rgba(122,15,36,0.85)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(212,175,55,0.18)'
          }}
        >
          {/* Zoom Controls */}
          <div className={`flex items-center overflow-hidden ${isMobile ? 'gap-2' : 'bg-[#7A0F24] rounded-full p-0.5'}`}>
            <button onClick={handleZoomOut} disabled={zoomLevel <= 0.75} className={`flex items-center justify-center text-[#F4EFE7] transition-all duration-250 disabled:opacity-30 ${isMobile ? 'w-[44px] h-[44px] rounded-xl bg-[#7A0F24] hover:bg-[#8F1730]' : 'w-[36px] h-[36px] rounded-full hover:bg-[#8F1730]'}`} title="Zoom Out">
              <ZoomOut className={isMobile ? 'w-5 h-5' : 'w-[16px] h-[16px]'} />
            </button>
            <div className={`text-center text-[#F4EFE7] font-bold ${isMobile ? 'w-16 text-sm' : 'w-14 text-[13px]'}`}>
              {Math.round(zoomLevel * 100)}%
            </div>
            <button onClick={handleZoomIn} disabled={zoomLevel >= 3} className={`flex items-center justify-center text-[#F4EFE7] transition-all duration-250 disabled:opacity-30 ${isMobile ? 'w-[44px] h-[44px] rounded-xl bg-[#7A0F24] hover:bg-[#8F1730]' : 'w-[36px] h-[36px] rounded-full hover:bg-[#8F1730]'}`} title="Zoom In">
              <ZoomIn className={isMobile ? 'w-5 h-5' : 'w-[16px] h-[16px]'} />
            </button>
          </div>

          <div className={`w-px ${isMobile ? 'h-8 bg-white/20 mx-2' : 'h-5 bg-white/20 mx-2'}`}></div>

          {downloadUrl && (
            <button onClick={handleMobileDownload} className={`flex items-center justify-center text-[#F4EFE7] transition-all duration-250 ${isMobile ? 'w-[44px] h-[44px] rounded-xl bg-[#7A0F24] hover:bg-[#8F1730]' : 'h-[36px] px-3 rounded-full hover:bg-[#7A0F24]'}`} title="Download">
              <Download className={isMobile ? 'w-5 h-5' : 'w-[16px] h-[16px]'} />
              {!isMobile && <span className="ml-2 text-[13px] font-semibold">Download</span>}
            </button>
          )}

          {pdfUrl && (
            <button onClick={handleOpenPdf} className={`flex items-center justify-center text-[#F4EFE7] transition-all duration-250 ${isMobile ? 'w-[44px] h-[44px] rounded-xl bg-[#7A0F24] hover:bg-[#8F1730]' : 'h-[36px] px-3 rounded-full hover:bg-[#7A0F24]'}`} title="Open PDF">
              <ExternalLink className={isMobile ? 'w-5 h-5' : 'w-[16px] h-[16px]'} />
              {!isMobile && <span className="ml-2 text-[13px] font-semibold">Open PDF</span>}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        ref={mainAreaRef}
        className={`flex-1 min-h-0 relative w-full overflow-hidden flex items-center justify-center ${isMobile ? 'p-2 sm:p-4 pb-24' : 'px-8 pt-[20px] pb-[20px]'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ 
          touchAction: zoomLevel > 1 ? 'none' : 'auto', 
          cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'auto' 
        }}
      >

        {/* Floating Navigation Arrows (Desktop) */}
        {!isMobile && numPages > 1 && (
          <>
            <button
              onClick={prevButtonClick}
              disabled={currentPage === 0}
              className="absolute left-[24px] top-1/2 -translate-y-1/2 z-40 w-[56px] h-[56px] rounded-full bg-[#7A0F24] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-[#5B0E21] text-white flex items-center justify-center transition-all duration-300 disabled:opacity-0 shadow-xl"
              title="Previous Page"
            >
              ◀
            </button>
            <button
              onClick={nextButtonClick}
              disabled={currentPage >= maxPageIdx}
              className="absolute right-[24px] top-1/2 -translate-y-1/2 z-40 w-[56px] h-[56px] rounded-full bg-[#7A0F24] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-[#5B0E21] text-white flex items-center justify-center transition-all duration-300 disabled:opacity-0 shadow-xl"
              title="Next Page"
            >
              ▶
            </button>
          </>
        )}

        {/* Zoom Transform Wrapper */}
        {numPages === 1 ? (
          <div
            className={`relative flex items-center justify-center origin-center shadow-2xl transition-transform ${isDragging ? 'duration-0' : 'duration-300'}`}
            style={{
              width: `${targetWidth}px`,
              height: `${targetHeight}px`,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`
            }}
          >
            <PdfPage
              pageNum={1}
              pdf={pdf}
              currentPage={0}
              isCover={false}
            />
          </div>
        ) : (
          <div
            className={`relative flex items-center justify-center origin-center transition-transform ${isDragging ? 'duration-0' : 'duration-300'}`}
            style={{
              width: `${targetWidth}px`,
              height: `${targetHeight}px`,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel}) translateX(${xShift})`
            }}
          >
            <HTMLFlipBook
              width={pageDims.width}
              height={pageDims.height}
              size="stretch"
              minWidth={100}
              maxWidth={9999}
              minHeight={100}
              maxHeight={9999}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={true}
              useMouseEvents={zoomLevel === 1} // Disable drag-to-flip while zoomed for panning
              onFlip={onFlip}
              usePortrait={pagesToShow === 1}
              ref={bookRef}
              className={`mx-auto shadow-2xl ${isMobile ? '' : 'rounded-sm overflow-hidden'}`}
              style={{ margin: '0 auto' }}
            >
              {Array.from({ length: numPages }).map((_, i) => (
                <PdfPage
                  key={i}
                  pageNum={i + 1}
                  pdf={pdf}
                  currentPage={currentPage}
                  isCover={i === 0 || (i === numPages - 1 && numPages % 2 === 0)}
                />
              ))}
              {numPages % 2 !== 0 && (
                <div
                  key="blank-back-cover"
                  className="bg-transparent overflow-hidden relative w-full h-full"
                  data-density="hard"
                ></div>
              )}
            </HTMLFlipBook>
          </div>
        )}
      </div>

      {/* Desktop Footer: 44px */}
      {!isMobile && (
        <div
          className="w-full h-[44px] shrink-0 flex items-center justify-center px-8 z-50"
          style={{ background: '#5B0E21' }}
        >
          <div className="text-[#F4EFE7]/80 font-bold tracking-widest text-xs">
            {currentPage + 1} / {numPages}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation (Floating) */}
      {isMobile && numPages > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[400px]">
          <div className="bg-[#5B0E21] text-white rounded-full flex items-center justify-between p-2 shadow-[0_10px_25px_rgba(0,0,0,0.5)] border border-[#D4AF37]/30 backdrop-blur-md">
            <button
              onClick={prevButtonClick}
              disabled={currentPage === 0}
              className="h-[48px] px-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#D4AF37] active:bg-[#D4AF37]/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 font-bold tracking-wide"
            >
              ◀ Previous
            </button>

            <div className="text-sm font-bold tracking-widest px-2 truncate text-[#D4AF37]">
              {currentPage + 1} / {numPages}
            </div>

            <button
              onClick={nextButtonClick}
              disabled={currentPage >= maxPageIdx}
              className="h-[48px] px-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#D4AF37] active:bg-[#D4AF37]/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 font-bold tracking-wide"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
