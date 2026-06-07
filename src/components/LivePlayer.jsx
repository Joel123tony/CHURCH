import { useEffect, useState } from "react";

export default function LivePlayer() {
  const [videoId, setVideoId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/youtube/live")
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
        {videoId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Live Stream"
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