import { useEffect, useRef, useState } from "react";
import API from "../api/axios";

export default function Hero() {
  const [video, setVideo] = useState({
    videoId: "",
    title: "",
  });

  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const retryRef = useRef(0);

  const fetchYoutubeVideo = async () => {
    try {
      const res = await API.get("/youtube");
      const data = res?.data || {};

      setVideo({
        videoId: data?.videoId || "",
        title: data?.title || "",
      });

      retryRef.current = 0;
    } catch (err) {
      console.error("Hero API error:", err);

      retryRef.current += 1;

      if (retryRef.current < 3) {
        setTimeout(fetchYoutubeVideo, 2000);
      } else {
        setVideo({ videoId: "", title: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYoutubeVideo();

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      fetchYoutubeVideo();
    }, 60000);

    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <section className="bg-primary text-white py-16">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

        {/* LEFT SIDE */}
        <div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            MTC Padikuppam
          </h1>

          <p className="text-lg leading-8 text-white/80">
          MTC Padikuppam (Methodist Tamil Church) serves the local community through Christ-centered worship, prayer, and sound biblical teaching. We are committed to making disciples through spiritual growth, meaningful fellowship, and regular Bible study. Our church actively reaches out to the community through various outreach ministries, sharing God’s love in practical ways and supporting those in need. Together, we seek to grow in faith, build strong families, and live as faithful followers of Christ, rooted in grace and truth.
          </p>
        </div>

        {/* RIGHT SIDE - PLAYER */}
        <div className="bg-cream rounded-3xl p-4 shadow-2xl">

          {/* VIDEO WRAPPER */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">

            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <p className="text-gray-500 font-semibold">Loading...</p>
              </div>
            ) : !video.videoId ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <p className="text-gray-500 font-semibold">
                  No Video Available
                </p>
              </div>
            ) : (
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                title={video.title || "YouTube Video"}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            )}
          </div>

          {/* STATUS BAR */}
          <div className="flex justify-between items-center mt-4">
            <span className="font-bold text-primary">
              {video.videoId ? "🔴 Latest Sermon" : "No Video"}
            </span>

            <a
              href={
                video.videoId
                  ? `https://www.youtube.com/watch?v=${video.videoId}`
                  : "https://www.youtube.com/@MethodistChurchPadikuppam"
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`px-5 py-2 rounded-full font-medium transition ${
                video.videoId
                  ? "bg-primary hover:bg-red-700 text-white"
                  : "bg-primary hover:opacity-90 text-white"
              }`}
            >
              {video.videoId ? "▶ Watch Video on YouTube" : "Watch on YouTube"}
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}