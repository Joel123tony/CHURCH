import { useEffect, useState } from "react";

export default function LivePlayer() {
  const [videoId, setVideoId] = useState(null);

  useEffect(() => {
    fetch("/api/youtube/live")
      .then((res) => res.json())
      .then((data) => {
        if (data.live) {
          setVideoId(data.videoId);
        }
      });
  }, []);

  return (
    <div className="bg-cream rounded-3xl p-4">
      <div className="bg-white rounded-2xl h-72 overflow-hidden">
    {live && videoId ? (
  <iframe
    className="w-full h-72 rounded-2xl"
    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
    title="Live Stream"
    allow="autoplay; encrypted-media"
    allowFullScreen
  />
) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No Live Stream Currently
          </div>
        )}
      </div>

      <div className="flex justify-between mt-4">
        <span className="font-medium">Live Now</span>
      </div>
    </div>
  );
}
