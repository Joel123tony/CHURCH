import { useEffect } from "react";
import PdfBookReader from "./PdfBookReader";

/**
 * Normalize Cloudinary raw PDF URLs.
 */
function normalizePdfUrl(url) {
  if (!url || typeof url !== "string") return url;
  
  // Remove fl_attachment to ensure inline display
  let normalized = url;
  if (normalized.includes("/fl_attachment/")) {
    normalized = normalized.replace("/fl_attachment/", "/");
  } else if (normalized.includes("fl_attachment:")) {
    normalized = normalized.replace(/fl_attachment:[^/]+\//, "");
  }

  if (normalized.includes("/raw/upload/") && !normalized.toLowerCase().endsWith(".pdf")) {
    return normalized + ".pdf";
  }
  return normalized;
}

/**
 * Helper to generate a download URL for Cloudinary if applicable,
 * otherwise just returns the URL.
 */
function getDownloadUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
}

export default function PdfViewerModal({ isOpen, onClose, pdfUrl, title }) {
  const resolvedUrl = normalizePdfUrl(pdfUrl);
  const downloadUrl = getDownloadUrl(resolvedUrl);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent transition-opacity p-0"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full h-full bg-transparent overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-1 w-full h-full bg-transparent overflow-hidden">
          <PdfBookReader 
            pdfUrl={resolvedUrl} 
            title={title || "PDF Document"} 
            downloadUrl={downloadUrl} 
            onClose={onClose} 
          />
        </div>
      </div>
    </div>
  );
}
