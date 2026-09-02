import React, { useEffect, useMemo, useState, useCallback, memo, useRef } from "react";
import { FaTimes, FaDownload, FaSpinner, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { FadeUp } from "./animations/index.jsx";

function getMediaDate(item) {
  const value = item?.eventDate || item?.createdAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

const FeaturedSlider = memo(({ items, onMediaClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  
  const timerRef = useRef(null);
  const numItems = items.length;

  const startTimer = useCallback(() => {
    if (numItems <= 1) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev === numItems - 1 ? 0 : prev + 1));
    }, 5000);
  }, [numItems]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer, currentIndex]);

  const handleNext = useCallback((e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === numItems - 1 ? 0 : prev + 1));
  }, [numItems]);

  const handlePrev = useCallback((e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? numItems - 1 : prev - 1));
  }, [numItems]);

  const handleDotClick = (index, e) => {
    e?.stopPropagation();
    setCurrentIndex(index);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  if (numItems === 0) return null;

  return (
    <div 
      className="relative w-full overflow-hidden rounded-[20px] shadow-lg aspect-[4/3] sm:aspect-[16/10] md:aspect-auto md:w-[560px] md:h-[300px] lg:w-[640px] lg:h-[320px] xl:w-[768px] xl:h-[350px] mx-auto bg-[#5d1324] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#54091b]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => onMediaClick?.(items[currentIndex])}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onMediaClick?.(items[currentIndex]);
        }
        if (e.key === "ArrowLeft") {
          handlePrev();
        }
        if (e.key === "ArrowRight") {
          handleNext();
        }
      }}
    >
      {items.map((item, index) => {
        const isActive = index === currentIndex;
        const isVideo = item.mediaType === "video";
        const imgSrc = isVideo ? (item.thumbnail || item.url.replace(/\.[^/.]+$/, ".jpg")) : item.url;
        
        return (
          <div 
            key={item._id || index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
          >
             <img 
               src={imgSrc} 
               alt=""
               className={`w-full h-full object-cover transition-transform duration-700 ease-out ${isActive ? 'scale-100' : 'scale-105'}`}
               loading={index === 0 ? "eager" : "lazy"}
               decoding="async"
             />
          </div>
        );
      })}

      {numItems > 1 && (
        <>
          <button 
            onClick={handlePrev}
            aria-label="Previous image"
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 md:h-12 md:w-12 items-center justify-center rounded-full bg-black/20 text-white/90 backdrop-blur-md transition-all hover:bg-black/50 hover:scale-110"
          >
            <FaChevronLeft size={16} className="md:w-5 md:h-5 ml-[-2px]" />
          </button>
          <button 
            onClick={handleNext}
            aria-label="Next image"
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 md:h-12 md:w-12 items-center justify-center rounded-full bg-black/20 text-white/90 backdrop-blur-md transition-all hover:bg-black/50 hover:scale-110"
          >
            <FaChevronRight size={16} className="md:w-5 md:h-5 mr-[-2px]" />
          </button>

          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:gap-3">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={(e) => handleDotClick(index, e)}
                aria-label={`Go to slide ${index + 1}`}
                className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});
function CompactTile({ item, onClick, t, aspectClass = "aspect-square" }) {
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
      className={`group relative ${aspectClass} w-full cursor-pointer overflow-hidden rounded-[10px] sm:rounded-[12px] bg-[#5d1324] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#54091b]`}
    >
      {isVideo ? (
        <img
          src={item.thumbnail || item.url.replace(/\.[^/.]+$/, ".jpg")}
          alt={item.title || "video thumbnail"}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          onLoad={() => setLoading(false)}
        />
      ) : (
        <img
          src={item.url}
          alt={item.title || "gallery media"}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          onLoad={() => setLoading(false)}
        />
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#5d1324]"></div>
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

const Gallery = memo(function Gallery({ initialGallery, waitForData }) {
  const { t } = useLanguage();
  const [featuredMedia, setFeaturedMedia] = useState(() => {
    if (initialGallery && initialGallery.length > 0) {
      return [...initialGallery].sort((a, b) => getMediaDate(b) - getMediaDate(a));
    }
    return [];
  });
  const [allMedia, setAllMedia] = useState([]);
  const [loading, setLoading] = useState(() => !initialGallery);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [touchStartX, setTouchStartX] = useState(null);

  const handleDownload = (media) => {
    if (downloading || (!media?.originalUrl && !media?.url)) return;

    try {
      let baseName = media.title ? media.title.trim() : "Media";
      baseName = baseName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      if (!baseName) baseName = "Media";

      let downloadUrl = media.originalUrl || media.url;

      if (downloadUrl.includes("res.cloudinary.com") && downloadUrl.includes("/upload/")) {
        const parts = downloadUrl.split("/upload/");
        const segments = parts[1].split("/");
        // Remove transformation block if present (starts with letters and contains underscore)
        if (segments[0].match(/^[a-z]+_/)) {
          segments.shift();
        }
        downloadUrl = `${parts[0]}/upload/fl_attachment:${baseName}/${segments.join("/")}`;
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = baseName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
      setToastMessage(t("Unable to download the media. Please try again."));
      setTimeout(() => setToastMessage(""), 4000);
    }
  };

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const featuredRes = await API.get("/gallery/client");
      const featured = featuredRes?.data?.data || [];
      setFeaturedMedia([...featured].sort((a, b) => getMediaDate(b) - getMediaDate(a)));
    } catch (err) {
      console.error("Failed to load featured gallery data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialGallery) {
      setFeaturedMedia([...initialGallery].sort((a, b) => getMediaDate(b) - getMediaDate(a)));
      setLoading(false);
      return;
    }

    if (waitForData) return;

    fetchGallery();
  }, [initialGallery, waitForData]);

  const [loadingAll, setLoadingAll] = useState(false);

  const handleOpenModal = async () => {
    setOpenModal(true);
    if (allMedia.length === 0) {
      setLoadingAll(true);
      try {
        const allRes = await API.get("/gallery");
        const all = allRes?.data?.data || [];
        setAllMedia([...all].sort((a, b) => getMediaDate(b) - getMediaDate(a)));
      } catch (err) {
        console.error("Failed to load all gallery data:", err);
      } finally {
        setLoadingAll(false);
      }
    }
  };

  useEffect(() => {
    const shouldLock = openModal || !!selectedMedia;
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
  }, [openModal, selectedMedia]);

  const [filterMode, setFilterMode] = useState("all");

  const filteredMedia = useMemo(() => {
    const query = search.toLowerCase().trim();
    let sorted = [...allMedia].sort((a, b) => getMediaDate(b) - getMediaDate(a));

    if (filterMode === "photos") {
      sorted = sorted.filter(m => m.mediaType !== "video");
    } else if (filterMode === "videos") {
      sorted = sorted.filter(m => m.mediaType === "video");
    } else if (filterMode === "pinned") {
      sorted = sorted.filter(m => m.clientPriority !== null && m.clientPriority !== undefined);
    }

    if (!query) return sorted;

    return sorted.filter((item) =>
      [item.title, item.eventName, item.description]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    );
  }, [allMedia, search, filterMode]);

  const groupedMedia = useMemo(() => {
    const groups = {};
    filteredMedia.forEach((item) => {
      const timestamp = getMediaDate(item);
      const dateObj = new Date(timestamp);
      const dateStr = dateObj.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[dateStr]) {
        groups[dateStr] = { dateStr, timestamp, items: [] };
      }
      groups[dateStr].items.push(item);
    });
    return Object.values(groups).sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredMedia]);

  const closeModal = () => {
    setSearch("");
    setOpenModal(false);
  };

  const activeList = openModal ? filteredMedia : featuredMedia;
  const currentIndex = selectedMedia ? activeList.findIndex((m) => m._id === selectedMedia._id) : -1;
  const hasNext = currentIndex !== -1 && currentIndex < activeList.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = useCallback(() => {
    if (hasNext) setSelectedMedia(activeList[currentIndex + 1]);
  }, [hasNext, activeList, currentIndex]);

  const handlePrev = useCallback(() => {
    if (hasPrev) setSelectedMedia(activeList[currentIndex - 1]);
  }, [hasPrev, activeList, currentIndex]);

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

  const modalGridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2";

  return (
    <>
      <section id="gallery" className="py-16 bg-[#F4EFE7]">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-3xl font-bold text-[#54091b]">
                {t("Gallery")}
              </h2>

              <button
                onClick={handleOpenModal}
                className="rounded-full border border-[#54091b] bg-[#F4EFE7] px-5 py-2.5 text-sm font-bold text-[#54091b] transition hover:bg-[#54091b] hover:text-[#F4EFE7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#54091b]/40"
              >
                {t("All Media")}
              </button>
            </div>
          </FadeUp>

          {loading ? (
            <div className="w-full rounded-[20px] bg-[#5d1324]/50 animate-pulse aspect-[4/3] sm:aspect-[16/10] md:aspect-auto md:w-[560px] md:h-[300px] lg:w-[640px] lg:h-[320px] xl:w-[768px] xl:h-[350px] mx-auto border border-[#d4af37]/10" />
          ) : featuredMedia.length > 0 ? (
            <FeaturedSlider items={featuredMedia} onMediaClick={setSelectedMedia} />
          ) : (
            <div className="flex w-full items-center justify-center p-8 text-[#54091b]/60">
               {t("No featured media.")}
            </div>
          )}
        </div>
      </section>

      {openModal && (
        <div className="fixed inset-0 z-50 bg-[#F4EFE7] flex flex-col overflow-y-auto">
          <div className="bg-[#F4EFE7] px-4 py-6 sm:px-8 flex flex-col gap-6 shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#54091b] tracking-tight">
                  {t("All Media")}
                </h1>
                <p className="text-[#54091b]/70 mt-2 text-base">
                  {t("Browse photos and videos from our church community")}
                </p>
              </div>
              <button
                onClick={closeModal}
                aria-label="Close gallery"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-[#54091b]/5 text-[#54091b] transition border border-[#d9cfbf]"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                {["all", "photos", "videos", "pinned"].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      filterMode === mode 
                        ? "bg-[#54091b] text-white" 
                        : "bg-white text-[#54091b] border border-[#d9cfbf] hover:bg-[#54091b]/5"
                    }`}
                  >
                    {t(mode.charAt(0).toUpperCase() + mode.slice(1))}
                  </button>
                ))}
              </div>

              <div className="w-full sm:max-w-xs relative shrink-0">
                <input
                  type="text"
                  placeholder={t("Search gallery...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-full border border-[#d9cfbf] bg-white px-4 text-sm text-[#54091b] outline-none transition focus:ring-2 focus:ring-[#54091b]/20"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 sm:px-8 pb-16 bg-[#F4EFE7]">
            <div className="mx-auto max-w-[1600px]">
              {loadingAll ? (
                <div className="mt-12 text-center text-[#54091b]/60 flex flex-col items-center gap-3">
                  <FaSpinner className="animate-spin text-2xl" />
                  <span>{t("Loading all media...")}</span>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="mt-12 text-center text-[#54091b]/60 text-lg">{t("No media found")}</div>
              ) : (
                <div className="space-y-8">
                  {groupedMedia.map((group) => (
                    <section key={group.dateStr}>
                      <h2 className="text-lg sm:text-xl font-bold text-[#54091b] mb-4 tracking-tight">
                        {group.dateStr}
                      </h2>
                      <div className={modalGridClasses}>
                        {group.items.map((item) => (
                          <CompactTile
                            key={item._id}
                            item={item}
                            onClick={() => setSelectedMedia(item)}
                            t={t}
                            aspectClass="aspect-square"
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
            {currentIndex + 1} / {activeList.length}
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
    </>
  );
});

export default Gallery;
