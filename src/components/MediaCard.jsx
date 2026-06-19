import { useEffect, useRef, useState } from "react";

export default function MediaCard({ item, onDelete, onEdit }) {
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
      <div className="group border rounded-2xl overflow-hidden shadow bg-white transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl">
        <div className={`relative bg-black overflow-hidden ${mediaFrameClass}`}>
          {isVideo ? (
            <video
              ref={videoRef}
              src={item.url}
              className="h-full w-full object-cover cursor-pointer transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              muted
              preload="metadata"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={() => setOpen(true)}
              onLoadedMetadata={(e) => {
                setLoading(false);
                updateShape(e.currentTarget.videoWidth, e.currentTarget.videoHeight);
              }}
            />
          ) : (
            <img
              src={item.url}
              alt={item.title}
              className="h-full w-full object-cover cursor-pointer transition-transform duration-700 ease-out group-hover:scale-[1.05]"
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
            <div className="absolute top-3 right-3 bg-black/70 text-white px-2.5 py-1.5 text-xs rounded-full backdrop-blur-sm">
              ▶ Video
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold truncate">{item.title}</h3>

          {item.date && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(item.date).toLocaleDateString()}
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onEdit(item)}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
            >
              Edit
            </button>

            <button
              onClick={() => onDelete(item._id)}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 bg-white text-black px-3 py-1 rounded-full shadow"
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
                className="w-full max-h-[80vh] object-contain rounded bg-black"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
