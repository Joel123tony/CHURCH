import { memo, useEffect, useRef, useState } from "react";
import { FaEdit, FaTrashAlt, FaThumbtack, FaCalendarAlt, FaPlay, FaImage } from "react-icons/fa";

function MediaCard({
  item,
  onDelete,
  onEdit,
  selected = false,
  onSelectToggle,
  isPinned = false,
  onTogglePin,
}) {
  const videoRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const isVideo = item.mediaType === "video";

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <>
      <div
        className={`group flex flex-col h-full overflow-hidden rounded-[20px] bg-white transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl ${
          selected
            ? "border-2 border-[#54091b] shadow-md"
            : "border border-slate-100 shadow-sm"
        }`}
      >
        {/* IMAGE/VIDEO WRAPPER - Fixed 4:3 Aspect Ratio */}
        <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden shrink-0 border-b border-slate-100">
          {typeof onSelectToggle === "function" && (
            <label className="absolute left-3 top-3 z-30 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm backdrop-blur transition-transform hover:scale-110">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onSelectToggle(item._id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4.5 w-4.5 rounded border-slate-300 text-[#54091b] focus:ring-[#54091b] cursor-pointer"
                aria-label={`Select ${item.title || "media"}`}
              />
            </label>
          )}

          {isVideo && (
            <div className="absolute right-3 top-3 z-20 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold tracking-wider text-white backdrop-blur-md flex items-center gap-1.5 shadow-sm uppercase">
              <FaPlay size={10} /> Video
            </div>
          )}

          {isVideo ? (
            <video
              ref={videoRef}
              src={item.url}
              className="h-full w-full cursor-pointer object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              muted
              preload="metadata"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={() => setOpen(true)}
              onLoadedMetadata={() => setLoading(false)}
              onError={() => { setLoading(false); setImageError(true); }}
            />
          ) : imageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-300">
              <FaImage className="text-4xl mb-2 opacity-50" />
              <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
            </div>
          ) : (
            <img
              src={item.url}
              alt={item.title}
              className="h-full w-full cursor-pointer object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              onClick={() => setOpen(true)}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setImageError(true); }}
            />
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* CARD CONTENT */}
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="text-base font-bold text-slate-800 line-clamp-2 leading-snug" title={item.title}>
            {item.title || "Untitled Media"}
          </h3>

          {item.date && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <FaCalendarAlt className="text-slate-400" />
              {new Date(item.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className={`mt-auto border-t border-slate-100 bg-slate-50 grid ${onTogglePin ? 'grid-cols-3' : 'grid-cols-2'} divide-x divide-slate-100`}>
          <button
            onClick={() => onEdit(item)}
            className="py-3.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit Details"
          >
            <FaEdit />
            <span className="hidden sm:inline">Edit</span>
          </button>

          {onTogglePin && (
            <button
              onClick={() => onTogglePin(item._id)}
              className={`py-3.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-colors ${
                isPinned
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
              }`}
              title={isPinned ? "Pinned to Homepage" : "Pin to Homepage"}
            >
              <FaThumbtack className={isPinned ? "text-emerald-700" : ""} />
              <span className="hidden sm:inline">{isPinned ? "Pinned" : "Pin"}</span>
            </button>
          )}

          <button
            onClick={() => onDelete(item._id)}
            className="py-3.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#ee0039] hover:bg-rose-50 transition-colors"
            title="Delete Permanently"
          >
            <FaTrashAlt />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* FULLSCREEN PREVIEW MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex flex-col items-center justify-center max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-12 right-0 md:-right-12 md:top-0 rounded-full bg-white/10 hover:bg-white/20 p-3 text-white transition-colors backdrop-blur-sm z-[110]"
              title="Close Preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            {isVideo ? (
              <video
                src={item.url}
                controls
                autoPlay
                className="max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] sm:max-h-[90vh] rounded-xl bg-black object-contain shadow-2xl ring-1 ring-white/20"
              />
            ) : (
              <img
                src={item.url}
                alt={item.title}
                className="max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] sm:max-h-[90vh] rounded-xl object-contain shadow-2xl ring-1 ring-white/20"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default memo(MediaCard);
