import { useEffect, useRef, useState } from "react";

export default function MediaCard({ item, onDelete, onEdit }) {
  const videoRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isVideo = item.mediaType === "video";

  /* =========================
     ESC TO CLOSE MODAL
  ========================= */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  /* =========================
     SAFE VIDEO HOVER PLAY
  ========================= */
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
      {/* ================= CARD ================= */}
      <div className="border rounded-lg overflow-hidden shadow bg-white hover:shadow-lg transition">

        {/* MEDIA */}
        <div className="relative group bg-black">

          {isVideo ? (
            <video
              ref={videoRef}
              src={item.url}
              className="w-full h-48 object-cover"
              muted
              preload="metadata"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={() => setOpen(true)}
              onLoadedData={() => setLoading(false)}
            />
          ) : (
            <img
              src={item.url}
              alt={item.title}
              className="w-full h-48 object-cover cursor-pointer"
              onClick={() => setOpen(true)}
              onLoad={() => setLoading(false)}
            />
          )}

          {/* LOADING OVERLAY */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          )}

          {/* VIDEO BADGE */}
          {isVideo && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
              ▶ Video
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="p-3">
          <h3 className="font-semibold truncate">{item.title}</h3>

          {item.date && (
            <p className="text-xs text-gray-500">
              {new Date(item.date).toLocaleDateString()}
            </p>
          )}

          {/* ACTIONS */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onEdit(item)}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Edit
            </button>

            <button
              onClick={() => onDelete(item._id)}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* ================= FULLSCREEN MODAL ================= */}
      {open && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 bg-white text-black px-3 py-1 rounded"
            >
              ✕
            </button>

            {isVideo ? (
              <video
                src={item.url}
                controls
                autoPlay
                className="w-full max-h-[80vh] rounded bg-black"
              />
            ) : (
              <img
                src={item.url}
                alt={item.title}
                className="w-full max-h-[80vh] object-contain rounded bg-black"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}