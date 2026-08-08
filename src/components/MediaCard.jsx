import { memo, useEffect, useRef, useState } from "react";
import { FaEdit, FaTrashAlt, FaThumbtack, FaPlay, FaImage } from "react-icons/fa";

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
    if (videoRef.current) videoRef.current.play().catch(() => {});
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
        className={`group relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#531B24] ${
          selected ? "ring-2 ring-[#531B24] scale-[0.98] border-transparent" : "hover:shadow-md hover:scale-[1.02] hover:border-slate-300"
        }`}
      >
        {/* MEDIA LAYER */}
        {isVideo ? (
          <video
            ref={videoRef}
            src={item.url}
            className="h-full w-full object-cover"
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
            <FaImage className="text-3xl mb-1 opacity-50" />
          </div>
        ) : (
          <img
            src={item.thumbnail || item.url}
            alt={item.title}
            className="h-full w-full object-cover"
            onClick={() => setOpen(true)}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setImageError(true); }}
          />
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-200 animate-pulse"></div>
        )}

        {/* TOP BADGES */}
        <div className="absolute top-0 left-0 right-0 p-2 flex items-start justify-between pointer-events-none">
          <div className="pointer-events-auto">
            <label className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm transition-transform hover:scale-110 ${selected ? 'bg-[#531B24] border-[#531B24] text-white' : 'opacity-0 group-hover:opacity-100 text-transparent'}`}>
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onSelectToggle(item._id)}
                onClick={(e) => e.stopPropagation()}
                className="hidden"
              />
              {selected && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
            </label>
          </div>

          {/* STATUS BADGES */}
          <div className="flex flex-col gap-1 items-end">
            {isVideo && (
              <div className="rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white backdrop-blur-md">
                <FaPlay className="inline-block mr-1 text-[8px]" />
                VIDEO
              </div>
            )}
            {isPinned && (
              <div className="rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white backdrop-blur-md flex items-center gap-1 shadow-sm">
                <FaThumbtack size={8} /> PINNED
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION BAR (Hover) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end">
          <p className="truncate text-xs font-semibold text-white mb-2 shadow-sm drop-shadow-md">
            {item.title || "Untitled Media"}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="flex-1 flex justify-center py-1.5 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-md"
              title="Edit"
            >
              <FaEdit size={12} />
            </button>
            {onTogglePin && (
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePin(item._id); }}
                className={`flex-1 flex justify-center py-1.5 rounded-md transition-colors backdrop-blur-md ${isPinned ? 'bg-emerald-500/90 hover:bg-emerald-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                title={isPinned ? "Unpin" : "Pin"}
              >
                <FaThumbtack size={12} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}
              className="flex-1 flex justify-center py-1.5 rounded-md bg-white/20 hover:bg-red-500/90 text-white transition-colors backdrop-blur-md"
              title="Delete"
            >
              <FaTrashAlt size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN PREVIEW MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-6 backdrop-blur-md"
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
                className="max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] sm:max-h-[90vh] rounded-md bg-black object-contain shadow-2xl"
              />
            ) : (
              <img
                src={item.url}
                alt={item.title}
                className="max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] sm:max-h-[90vh] rounded-md object-contain shadow-2xl"
              />
            )}
            <div className="absolute bottom-[-30px] text-white/70 text-sm font-medium">{item.title}</div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(MediaCard);
