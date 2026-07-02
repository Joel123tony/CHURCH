import React, { useEffect, useState } from "react";
import { FaSyncAlt, FaTimes } from "react-icons/fa";

export default function PreviewModal({ isOpen, onClose, url = "/" }) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Reset refresh key when opened to ensure fresh load
      setRefreshKey(prev => prev + 1);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const previewUrl = `${url}?preview=true&t=${Date.now()}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
    >
      <div
        className="flex h-[90vh] w-[90vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-transform"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <h2 className="text-lg font-bold text-slate-800">Preview Website</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <FaSyncAlt size={12} className="text-slate-500" />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-600 transition hover:bg-red-100 hover:text-red-600"
              aria-label="Close Preview"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Content (Iframe) */}
        <div className="flex-1 bg-slate-100">
          <iframe
            key={refreshKey}
            src={previewUrl}
            title="Live Preview"
            className="h-full w-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
