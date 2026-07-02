import { useEffect, useMemo, useState } from "react";
import { FaTimes } from "react-icons/fa";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

function getMediaDate(item) {
  const value = item?.eventDate || item?.createdAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function formatMediaDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function GalleryTile({ item, onClick, compact = false, t }) {
  const isVideo = item.mediaType === "video";
  const [shape, setShape] = useState("landscape");
  const [loading, setLoading] = useState(true);

  const frameClass =
    shape === "portrait"
      ? "aspect-[4/5]"
      : shape === "square"
        ? "aspect-square"
        : "aspect-[16/10]";

  const resolveShape = (width, height) => {
    if (!width || !height) return;

    const diff = Math.abs(width - height);
    const threshold = Math.max(width, height) * 0.12;

    if (diff <= threshold) {
      setShape("square");
      return;
    }

    setShape(width < height ? "portrait" : "landscape");
  };

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
      className="group block w-full cursor-pointer text-left bg-[#54091b] rounded-3xl overflow-hidden shadow-lg transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#54091b]"
    >
      <div className={`relative overflow-hidden bg-[#0f172a] ${frameClass}`}>
        {isVideo ? (
          <video
            src={item.url}
            controls={!compact}
            muted={compact}
            preload="metadata"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            onLoadedMetadata={(e) => {
              setLoading(false);
              resolveShape(
                e.currentTarget.videoWidth,
                e.currentTarget.videoHeight
              );
            }}
          />
        ) : (
          <img
            src={item.url}
            alt={item.title || "gallery media"}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            onLoad={(e) => {
              setLoading(false);
              resolveShape(
                e.currentTarget.naturalWidth,
                e.currentTarget.naturalHeight
              );
            }}
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-200/90 animate-pulse">
            <span className="text-xs font-medium text-slate-500">
              {compact ? "" : "Loading..."}
            </span>
          </div>
        )}

        {isVideo && (
          <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
            Video
          </div>
        )}
      </div>

      <div className={compact ? "p-3 sm:p-4" : "p-4 sm:p-5"}>
        <div className="flex items-start justify-between gap-3">
          <h3
            className="min-w-0 flex-1 truncate text-[15px] font-semibold sm:text-base"
            style={{ color: "#f4efe7" }}
          >
            {item.title ? t(item.title) : t("Untitled")}
          </h3>

          {item.eventDate && !compact && (
            <span className="shrink-0 rounded-full bg-[#f4efe7] px-2.5 py-1 text-[11px] font-semibold text-[#54091b]">
              {formatMediaDate(item.eventDate)}
            </span>
          )}
        </div>

        {!compact && item.createdAt && !item.eventDate && (
          <p className="mt-1 text-xs" style={{ color: "#f4efe7" }}>
            {formatMediaDate(item.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Gallery() {
  const { t, cmsData } = useLanguage();
  const styles = cmsData?.gallery?.styles || {};
  const [featuredMedia, setFeaturedMedia] = useState([]);
  const [allMedia, setAllMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);

        const [featuredRes, allRes] = await Promise.all([
          API.get("/gallery/client"),
          API.get("/gallery"),
        ]);

        const featured = featuredRes?.data?.data || [];
        const all = allRes?.data?.data || [];

        setFeaturedMedia(
          [...featured].sort((a, b) => getMediaDate(b) - getMediaDate(a))
        );
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

  const titleSuggestions = useMemo(() => {
    return [...new Set(allMedia.map((item) => item?.title).filter(Boolean))]
      .slice(0, 12)
      .sort((a, b) => a.localeCompare(b));
  }, [allMedia]);

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

  return (
    <>
      <section id="gallery" className="py-16" style={{ backgroundColor: styles.backgroundColor || "#F4EFE7" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-bold" style={{ color: styles.headingColor || "#54091b" }}>
              {t("Gallery")}
            </h2>

            <button
              onClick={() => setOpenModal(true)}
              className="rounded-full bg-[#54091b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6a1231] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#54091b]/40"
            >
              {t("All Media")}
            </button>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-72 rounded-3xl animate-pulse"
                  style={{ backgroundColor: styles.cardBackground || "#e5e5e5" }}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredMedia.map((item) => (
                <GalleryTile
                  key={item._id}
                  item={item}
                  onClick={() => setSelectedMedia(item)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {openModal && (
        <div className="fixed inset-0 z-50 bg-black/70">
          <div className="flex h-full flex-col">
            <div
              className="border-b border-[#6f2335] bg-[#54091b] px-4 py-4 shadow-sm sm:px-6"
              style={{ color: "#f4efe7" }}
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">
                    {t("All Media")}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                    {t("Gallery")}
                  </h2>
                </div>

                <div className="flex w-full items-center gap-3 md:max-w-2xl">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={t("Search...")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      list="gallery-title-suggestions"
                      className="h-12 w-full rounded-full border border-[#d9cfbf] bg-white px-5 pr-12 text-[#54091b] outline-none transition placeholder:text-[#8a6f60] focus:border-[#f4efe7] focus:ring-2 focus:ring-[#f4efe7]/20"
                    />

                    <datalist id="gallery-title-suggestions">
                      {titleSuggestions.map((title) => (
                        <option key={title} value={title} />
                      ))}
                    </datalist>
                  </div>

                  <button
                    onClick={closeModal}
                    aria-label="Close gallery"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#f4efe7]/45 bg-transparent transition hover:bg-[#f4efe7]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4efe7]/25"
                    style={{ color: "#f4efe7" }}
                  >
                    <FaTimes size={17} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain bg-[#f8f3ea] px-4 py-5 sm:px-6">
              <div className="mx-auto max-w-7xl">
                <div className="mb-4 flex items-center justify-between text-sm text-[#54091b]">
                  <span>
                    {filteredMedia.length}{" "}
                    {filteredMedia.length === 1 ? "item" : "items"}
                  </span>
                  <span>{t("Newest first")}</span>
                </div>

                {filteredMedia.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-600 shadow-sm">
                    {t("No media found")}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredMedia.map((item) => (
                      <GalleryTile
                        key={item._id}
                        item={item}
                        compact
                        onClick={() => setSelectedMedia(item)}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMedia && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMedia(null)}
              aria-label="Close viewer"
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:bg-white"
            >
              <FaTimes size={16} />
            </button>

            {selectedMedia.mediaType === "video" ? (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                className="max-h-[85vh] w-full rounded-2xl bg-black object-contain shadow-2xl"
              />
            ) : (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.title}
                className="max-h-[85vh] w-full rounded-2xl bg-black object-contain shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
