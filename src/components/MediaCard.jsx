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
  onPreview
}) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isVideo = item.mediaType === "video";

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
        onClick={() => { if (onPreview) onPreview(item); }}
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
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setImageError(true); }}
          />
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-200 animate-pulse"></div>
        )}

        {/* TOP BADGES & ACTIONS */}
        <div className="absolute top-0 left-0 right-0 p-2 flex flex-col gap-2 pointer-events-none">
          <div className="flex items-start justify-between w-full">
            <div className="pointer-events-auto">
              <label className={`flex h-7 w-7 lg:h-6 lg:w-6 cursor-pointer items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm transition-transform hover:scale-110 ${selected ? 'bg-[#531B24] border-[#531B24] text-white' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-transparent'}`}>
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

            {/* STATUS BADGES & MENU BUTTON */}
            <div className="flex flex-col gap-1.5 items-end pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md transition-opacity shadow-sm hover:bg-black/60 ${showMenu ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
              </button>

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

          {/* MENU DROPDOWN */}
          {showMenu && (
            <div className="absolute top-10 right-2 w-32 bg-white rounded-lg shadow-xl py-1 z-50 overflow-hidden border border-slate-100 pointer-events-auto animate-in fade-in zoom-in-95 duration-100">
               <button onClick={(e) => { e.stopPropagation(); onEdit(item); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium">
                 <FaEdit size={12}/> Edit
               </button>
               {onTogglePin && (
                 <button onClick={(e) => { e.stopPropagation(); onTogglePin(item._id); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium">
                   <FaThumbtack size={12}/> {isPinned ? "Unpin" : "Pin"}
                 </button>
               )}
               <button onClick={(e) => { e.stopPropagation(); onDelete(item._id); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium border-t border-slate-100">
                 <FaTrashAlt size={12}/> Delete
               </button>
            </div>
          )}
        </div>
        
        {/* SUBTLE OVERLAY FOR TITLE ON HOVER ONLY */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 opacity-0 transition-opacity duration-300 lg:group-hover:opacity-100 flex flex-col justify-end pointer-events-none">
          <p className="truncate text-xs font-medium text-white shadow-sm drop-shadow-md">
            {item.title || "Untitled Media"}
          </p>
        </div>
      </div>
    </>
  );
}

export default memo(MediaCard);
