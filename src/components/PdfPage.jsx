import React, { useEffect, useRef, useState } from "react";

const PdfPage = React.forwardRef(({ pageNum, pdf, currentPage, isCover, className = "" }, ref) => {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState(false);

  // Virtualization: narrow to exactly previous, current, and next spread (±3 pages)
  const isNear = Math.abs(currentPage - pageNum) <= 3;

  useEffect(() => {
    let renderTask = null;
    let isMounted = true;

    // Memory sweeping: destroy off-screen canvases instantly
    if (!isNear && rendered) {
      if (canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
      setRendered(false);
      return;
    }

    const renderPage = async () => {
      if (!isNear || rendered || !pdf || !canvasRef.current) return;

      try {
        const page = await pdf.getPage(pageNum);
        if (!isMounted) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext("2d");
        
        // Responsive scaling: use DPR capped at 1.5x to balance sharpness and VRAM usage
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const viewport = page.getViewport({ scale: dpr });
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
        
        if (isMounted) {
          setRendered(true);
        }
      } catch (err) {
        if (err.name !== 'RenderingCancelledException' && isMounted) {
          console.error(`Error rendering page ${pageNum}:`, err);
          setError(true);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pageNum, pdf, isNear, rendered]);

  return (
    <div 
      ref={ref} 
      className={`bg-white overflow-hidden flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] relative w-full h-full ${className}`}
      data-density={isCover ? "hard" : "soft"}
    >
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/10 to-transparent z-10 pointer-events-none mix-blend-multiply"></div>
      
      {!rendered && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F4EFE7]/50">
          <div className="w-8 h-8 border-4 border-[#54091b]/20 border-t-[#54091b] rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-400 mt-3">Page {pageNum}</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-400 text-xs font-bold">
          Failed to load page
        </div>
      )}

      <canvas 
        ref={canvasRef} 
        className={`w-full h-full object-contain transition-opacity duration-300 ${rendered ? 'opacity-100' : 'opacity-0'}`} 
      />
    </div>
  );
});

export default React.memo(PdfPage);
