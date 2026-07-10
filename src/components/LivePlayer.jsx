import { useEffect, useState } from "react";
import API from "../api/axios";

export default function LivePlayer() {
  const [videoId, setVideoId] = useState(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let mounted = true;

    API.get("/youtube/live")
      .then((res) => {
        if (!mounted) return;
        setLive(Boolean(res.data?.live));
        setVideoId(res.data?.videoId || null);
      })
      .catch(() => {
        if (!mounted) return;
        setLive(false);
        setVideoId(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-cream rounded-3xl p-4">
      <div className="bg-white rounded-2xl h-72 overflow-hidden">
        {live && videoId ? (
          <iframe
            className="h-72 w-full rounded-2xl"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
            title="Live Stream"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
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
