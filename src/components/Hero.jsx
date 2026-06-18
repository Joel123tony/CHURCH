import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Hero() {
  const [live, setLive] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval;

    const fetchYoutubeVideo = async () => {
      try {
        const res = await API.get("/youtube");
        const data = res?.data;

        if (!data) {
          setVideoId("");
          setLive(false);
          setTitle("");
          return;
        }

        // ✅ STRICT backend mapping (NO guessing)
        setVideoId(data.videoId || "");
        setLive(Boolean(data.live));
        setTitle(data.title || "");

      } catch (err) {
        console.error("YouTube API Error:", err);

        setVideoId("");
        setLive(false);
        setTitle("");
      } finally {
        setLoading(false);
      }
    };

    fetchYoutubeVideo();

    interval = setInterval(fetchYoutubeVideo, 30000);

    return () => clearInterval(interval);
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

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <div className="bg-cream text-primary p-5 rounded-xl shadow">
              <h3 className="font-bold mb-2">Address</h3>
              <p>
                No. 1, Vandiamman Koil Street,
                <br />
                Mogappair East, Chennai
              </p>
            </div>

            <div className="bg-cream text-primary p-5 rounded-xl shadow">
              <h3 className="font-bold mb-2">Languages</h3>
              <p>Tamil / English</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="bg-cream rounded-3xl p-4 text-primary shadow-lg">

          {/* LOADING */}
          {loading ? (
            <div className="bg-white rounded-2xl h-72 flex items-center justify-center">
              <p className="text-gray-500 font-semibold">Loading...</p>
            </div>
          ) : !videoId ? (
            <div className="bg-white rounded-2xl h-72 flex items-center justify-center">
              <p className="text-gray-500 font-semibold">
                No Videos Available
              </p>
            </div>
          ) : (
            <iframe
              className="w-full h-72 rounded-2xl"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`}
              title={title || "YouTube Video"}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          )}

          {/* STATUS BAR */}
          <div className="flex justify-between items-center mt-4">
            <span className="font-bold text-lg">
              {live ? "🔴 Live Now" : "Latest Sermon"}
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