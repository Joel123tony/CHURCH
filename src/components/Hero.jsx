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

      const id = data?.videoId || "";
      const title = data?.title || "";

      setVideo({ videoId: id, title });

      retryRef.current = 0; // reset retry on success
    } catch (err) {
      console.error("Hero API error:", err);

      // 🔥 Retry logic (self-healing)
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

    // clear old interval if exists
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      fetchYoutubeVideo();
    }, 60000); // safer interval (1 min)

    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <section className="bg-primary text-white py-16">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10">

        {/* LEFT SIDE */}
        <div>
          <h1 className="text-4xl font-bold mb-6">
            MTC Padikuppam
          </h1>

          <p className="leading-8 text-lg">
            Methodist Tamil Church serves the local community through worship,
            prayer, biblical teaching, discipleship, fellowship, and outreach ministries.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="bg-cream rounded-3xl p-4 text-primary shadow-lg">

          {/* LOADING */}
          {loading ? (
            <div className="bg-white rounded-2xl h-72 flex items-center justify-center">
              <p className="text-gray-500 font-semibold">
                Loading...
              </p>
            </div>
          ) : !video.videoId ? (
            <div className="bg-white rounded-2xl h-72 flex items-center justify-center">
              <p className="text-gray-500 font-semibold">
                No Video Available
              </p>
            </div>
          ) : (
            <iframe
              className="w-full h-72 rounded-2xl"
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&rel=0`}
              title={video.title || "YouTube Video"}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          )}

          {/* STATUS BAR */}
          <div className="flex justify-between items-center mt-4">
            <span className="font-bold text-lg">
              {video.videoId ? "🔴 Latest Sermon" : "No Video"}
            </span>

            <a
              href="https://www.youtube.com/@MethodistChurchPadikuppam"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white px-5 py-2 rounded-full font-medium hover:opacity-90 transition"
            >
              Watch on YouTube
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}