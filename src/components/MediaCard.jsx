import { memo, useEffect, useRef, useState } from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";

function MediaCard({
  item,
  onDelete,
  onEdit,
  selected = false,
  onSelectToggle,
}) {
  const videoRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mediaShape, setMediaShape] = useState("landscape");

  const isVideo = item.mediaType === "video";

  const mediaFrameClass =
    mediaShape === "portrait"
      ? "aspect-[4/5]"
      : mediaShape === "square"
        ? "aspect-square"
        : "aspect-[16/10]";

  const updateShape = (width, height) => {
    if (!width || !height) return;

    const diff = Math.abs(width - height);
    const threshold = Math.max(width, height) * 0.12;

    if (diff <= threshold) {
      setMediaShape("square");
      return;
    }

    setMediaShape(width < height ? "portrait" : "landscape");
  };

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
        className={`group overflow-hidden rounded-2xl border bg-white shadow transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg ${
          selected
            ? "border-blue-500 ring-2 ring-blue-200"
            : "border-slate-100"
        }`}
      >
        <div className={`relative overflow-hidden bg-black ${mediaFrameClass}`}>
          {typeof onSelectToggle === "function" && (
            <label className="absolute left-3 top-3 z-30 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm backdrop-blur">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onSelectToggle(item._id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                aria-label={`Select ${item.title || "media"}`}
              />
            </label>
          )}

          {isVideo ? (
            <video
              ref={videoRef}
              src={item.url}
              className="h-full w-full cursor-pointer object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              muted
              preload="metadata"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={() => setOpen(true)}
              onLoadedMetadata={(e) => {
                setLoading(false);
                updateShape(
                  e.currentTarget.videoWidth,
                  e.currentTarget.videoHeight
                );
              }}
            />
          ) : (
            <img
              src={item.url}
              alt={item.title}
              className="h-full w-full cursor-pointer object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              onClick={() => setOpen(true)}
              onLoad={(e) => {
                setLoading(false);
                updateShape(
                  e.currentTarget.naturalWidth,
                  e.currentTarget.naturalHeight
                );
              }}
            />
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          )}

          {isVideo && (
            <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1.5 text-xs text-white backdrop-blur-sm">
              ▶ Video
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="truncate font-semibold text-slate-900">{item.title}</h3>

          {item.date && (
            <p className="mt-1 text-xs text-gray-500">
              {new Date(item.date).toLocaleDateString()}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-sm text-white transition hover:bg-amber-600"
            >
              <FaEdit />
              Edit
            </button>

            <button
              onClick={() => onDelete(item._id)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition hover:bg-red-700"
            >
              <FaTrashAlt />
              Delete
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 rounded-full bg-white px-3 py-1 text-black shadow"
            >
              ×
            </button>

            {isVideo ? (
              <video
                src={item.url}
                controls
                autoPlay
                className="w-full max-h-[80vh] rounded bg-black object-contain"
              />
            ) : (
              <img
                src={item.url}
                alt={item.title}
                className="w-full max-h-[80vh] rounded bg-black object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default memo(MediaCard);
