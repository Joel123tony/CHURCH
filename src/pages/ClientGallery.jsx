import { useEffect, useMemo, useState, useCallback } from "react";
import { FaTimes, FaDownload, FaSpinner, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

function getMediaDate(item) {
  const value = item?.eventDate || item?.createdAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function CompactTile({ item, onClick, t }) {
  const isVideo = item.mediaType === "video";
  const [loading, setLoading] = useState(true);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-[10px] sm:rounded-[12px] bg-[#e5ddd3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#54091b]"
    >
      {isVideo ? (
        <img
          src={item.thumbnail || item.url.replace(/\.[^/.]+$/, ".jpg")}
          alt={item.title || "video thumbnail"}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          onLoad={() => setLoading(false)}
        />
      ) : (
        <img
          src={item.url}
          alt={item.title || "gallery media"}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          onLoad={() => setLoading(false)}
        />
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#e5ddd3] animate-pulse"></div>
      )}

      {isVideo && (
        <div className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wider text-white backdrop-blur-md">
          VIDEO
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 sm:p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden md:flex">
        <p className="truncate text-xs font-medium text-white shadow-sm">
          {item.title ? t(item.title) : t("Untitled")}
        </p>
      </div>
    </div>
  );
}

export default function ClientGallery() {
  const { t } = useLanguage();
  const [allMedia, setAllMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [touchStartX, setTouchStartX] = useState(null);

  const handleDownload = async (media) => {
    if (downloading || !media?.url) return;

    setDownloading(true);
    setToastMessage("");
    try {
      let baseName = media.title ? media.title.trim() : "Media";
      baseName = baseName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      if (!baseName) baseName = "Media";

      const urlParts = media.url.split('?')[0].split('/');
      const filenameFromUrl = urlParts[urlParts.length - 1];
      const urlExt = filenameFromUrl.split('.').pop();
      let extension = urlExt && urlExt.length <= 4 ? urlExt : (media.mediaType === "video" ? "mp4" : "jpg");

      const filename = `${baseName}.${extension}`;

      const response = await fetch(media.url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
      setToastMessage(t("Unable to download the media. Please try again."));
      setTimeout(() => setToastMessage(""), 4000);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const allRes = await API.get("/gallery");
        const all = allRes?.data?.data || [];
        setAllMedia([...all].sort((a, b) => getMediaDate(b) - getMediaDate(a)));
      } catch (err) {
        console.error("Failed to load gallery data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  useEffect(() => {
    const shouldLock = !!selectedMedia;
    if (!shouldLock) return undefined;

    const { body, documentElement } = document;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const originalBody = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    const originalHtml = documentElement.style.overflow;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = originalBody.overflow;
      body.style.position = originalBody.position;
      body.style.top = originalBody.top;
      body.style.width = originalBody.width;
      body.style.paddingRight = originalBody.paddingRight;
      documentElement.style.overflow = originalHtml;
      window.scrollTo(0, scrollY);
    };
  }, [selectedMedia]);

  const filteredMedia = useMemo(() => {
    const query = search.toLowerCase().trim();
    const sorted = [...allMedia].sort((a, b) => getMediaDate(b) - getMediaDate(a));

    if (!query) return sorted;

    return sorted.filter((item) =>
      [item.title, item.eventName, item.description]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    );
  }, [allMedia, search]);

  const currentIndex = selectedMedia ? filteredMedia.findIndex((m) => m._id === selectedMedia._id) : -1;
  const hasNext = currentIndex !== -1 && currentIndex < filteredMedia.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = useCallback(() => {
    if (hasNext) setSelectedMedia(filteredMedia[currentIndex + 1]);
  }, [hasNext, filteredMedia, currentIndex]);

  const handlePrev = useCallback(() => {
    if (hasPrev) setSelectedMedia(filteredMedia[currentIndex - 1]);
  }, [hasPrev, filteredMedia, currentIndex]);

  const handleTouchStart = (e) => setTouchStartX(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50 && hasNext) handleNext();
    else if (diff < -50 && hasPrev) handlePrev();
    setTouchStartX(null);
  };

  useEffect(() => {
    if (!selectedMedia) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") setSelectedMedia(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMedia, handleNext, handlePrev]);

  const gridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[6px] sm:gap-[8px]";

  return (
    <div className="min-h-screen bg-[#F4EFE7] pt-24 pb-16">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-[#54091b]">
            {t("Gallery")}
          </h1>
          <div className="w-full sm:max-w-md">
            <input
              type="text"
              placeholder={t("Search gallery...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-full border border-[#d9cfbf] bg-white px-4 text-sm text-[#54091b] outline-none transition focus:ring-2 focus:ring-[#54091b]/20"
            />
          </div>
        </div>

        {loading ? (
          <div className={gridClasses}>
            {[...Array(30)].map((_, i) => (
              <div key={i} className="aspect-square w-full rounded-[10px] sm:rounded-[12px] animate-pulse bg-[#e5ddd3]" />
            ))}
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="mt-12 text-center text-[#54091b]/60 py-16 text-lg">{t("No media found")}</div>
        ) : (
          <div className={gridClasses}>
            {filteredMedia.map((item) => (
              <CompactTile
                key={item._id}
                item={item}
                onClick={() => setSelectedMedia(item)}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      {selectedMedia && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md"
          onClick={() => setSelectedMedia(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-2 sm:left-4 top-1/2 z-20 flex h-12 w-12 sm:h-14 sm:w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white shadow-lg backdrop-blur-md transition hover:bg-white/20"
            >
              <FaChevronLeft size={20} />
            </button>
          )}

          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-2 sm:right-4 top-1/2 z-20 flex h-12 w-12 sm:h-14 sm:w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white shadow-lg backdrop-blur-md transition hover:bg-white/20"
            >
              <FaChevronRight size={20} />
            </button>
          )}

          <div className="absolute top-4 left-4 z-20 text-white/70 text-sm font-medium tracking-wide">
            {currentIndex + 1} / {filteredMedia.length}
          </div>

          <div className="absolute right-4 top-4 z-20 flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(selectedMedia); }}
              disabled={downloading}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 disabled:opacity-50"
            >
              {downloading ? <FaSpinner className="animate-spin" size={16} /> : <FaDownload size={16} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedMedia(null); }}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <FaTimes size={18} />
            </button>
          </div>

          <div className="relative w-full max-w-7xl px-4 sm:px-16" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.mediaType === "video" ? (
              <video
                key={selectedMedia._id}
                src={selectedMedia.url}
                controls
                autoPlay
                className="max-h-[85vh] w-full rounded-md object-contain"
              />
            ) : (
              <img
                key={selectedMedia._id}
                src={selectedMedia.url}
                alt={selectedMedia.title}
                className="max-h-[85vh] w-full rounded-md object-contain"
              />
            )}
            {selectedMedia.title && (
              <div className="absolute bottom-[-40px] left-0 right-0 text-center text-white/90 text-sm">
                {selectedMedia.title}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
