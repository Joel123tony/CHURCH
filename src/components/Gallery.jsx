import React, { useEffect, useMemo, useState, useCallback, memo } from "react";
import { FaTimes, FaDownload, FaSpinner, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { FadeUp } from "./animations/index.jsx";

function getMediaDate(item) {
  const value = item?.eventDate || item?.createdAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function PremiumPinnedCard({ item, onClick, t, className = "" }) {
  const isVideo = item.mediaType === "video";
  const [loading, setLoading] = useState(true);

  const dateStr = item.eventDate || item.createdAt;
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

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
      className={`group relative flex flex-col h-full bg-[#5d1324] rounded-[20px] overflow-hidden [transform:translateZ(0)] p-[8px] sm:p-4 border border-[#d4af37]/20 shadow-md shadow-[#54091b]/30 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-[#d4af37]/40 hover:shadow-[#54091b]/50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] ${className}`}
    >
      <div className="relative w-full overflow-hidden rounded-[14px] sm:rounded-[16px] [transform:translateZ(0)] aspect-video bg-[#3a0613]">
        {isVideo ? (
          <img
            src={item.thumbnail || item.url.replace(/\.[^/.]+$/, ".jpg")}
            alt={item.title || "video thumbnail"}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onLoad={() => setLoading(false)}
          />
        ) : (
          <img
            src={item.url}
            alt={item.title || "gallery media"}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onLoad={() => setLoading(false)}
          />
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#3a0613]"></div>
        )}

        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ring-1 ring-inset ring-[#d4af37]/30 rounded-[14px] sm:rounded-[16px]"></div>

        {isVideo && (
          <div className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#d4af37] backdrop-blur-md border border-[#d4af37]/30 shadow-sm">
            VIDEO
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col flex-1 px-1 sm:px-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm bg-[#d4af37]/15 text-[#d4af37] text-[9px] font-bold uppercase tracking-widest border border-[#d4af37]/20">
            ★ {t("Pinned")}
          </span>
          {item.category && (
            <span className="text-[10px] text-[#F4EFE7]/70 uppercase tracking-wide truncate">
              {item.category}
            </span>
          )}
        </div>

        <h3 className="text-[#F4EFE7] font-bold text-xs sm:text-sm leading-snug line-clamp-2 mb-1 group-hover:text-[#d4af37] transition-colors duration-300">
          {item.title ? t(item.title) : t("Featured Moment")}
        </h3>

        <div className="mt-auto pt-1.5 flex items-center text-[#F4EFE7]/70 text-[10px] font-medium">
          <span className="mr-1.5 opacity-80">📅</span>
          {formattedDate || t("Recent")}
        </div>
      </div>
    </div>
  );
}

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

      let downloadUrl = media.url;
      const originalFilename = media.title ? `${baseName}.${media.mediaType === 'video' ? 'mp4' : 'jpg'}` : "download";

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = originalFilename;
      link.target = "_blank"; // safely open in new tab if browser refuses to download
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

  const modalGridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[6px] sm:gap-[8px]";

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
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-6 -mx-5 px-5 scroll-pl-5 after:content-[''] after:w-[1px] after:shrink-0 md:after:hidden md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:gap-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col bg-[#5d1324] rounded-[20px] p-[8px] w-[260px] sm:w-[250px] shrink-0 snap-start md:w-full border border-[#d4af37]/10">
                  <div className="w-full aspect-video bg-[#3a0613] rounded-[14px] mb-3"></div>
                  <div className="h-3 bg-[#3a0613] rounded w-1/4 mb-2 ml-1"></div>
                  <div className="h-4 bg-[#3a0613] rounded w-3/4 mb-1.5 ml-1"></div>
                  <div className="mt-auto h-2 bg-[#3a0613] rounded w-1/3 pt-3 ml-1"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-6 -mx-5 px-5 scroll-pl-5 after:content-[''] after:w-[1px] after:shrink-0 md:after:hidden md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:gap-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {featuredMedia.map((item) => (
                <PremiumPinnedCard
                  key={item._id}
                  item={item}
                  onClick={() => setSelectedMedia(item)}
                  t={t}
                  className="w-[260px] sm:w-[250px] shrink-0 snap-start md:w-full"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {openModal && (
        <div className="fixed inset-0 z-50 bg-[#F4EFE7] flex flex-col">
          <div className="border-b border-[#d9cfbf] bg-[#F4EFE7] px-4 py-3 shadow-sm sm:px-6 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-[#54091b] hidden sm:block">
              {t("All Media")}
            </h2>
            <div className="flex flex-1 sm:max-w-md items-center gap-2 mx-auto sm:mx-4">
              <input
                type="text"
                placeholder={t("Search gallery...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-full border border-[#d9cfbf] bg-white px-4 text-sm text-[#54091b] outline-none transition focus:ring-2 focus:ring-[#54091b]/20"
              />
            </div>
            <button
              onClick={closeModal}
              aria-label="Close gallery"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-[#54091b]/5 text-[#54091b] transition"
            >
              <FaTimes size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-4 sm:p-6 bg-[#F4EFE7]">
            <div className="mx-auto max-w-[1600px]">
              {loadingAll ? (
                <div className="mt-12 text-center text-[#54091b]/60 flex flex-col items-center gap-3">
                  <FaSpinner className="animate-spin text-2xl" />
                  <span>{t("Loading all media...")}</span>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="mt-12 text-center text-[#54091b]/60">{t("No media found")}</div>
              ) : (
                <div className={modalGridClasses}>
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
