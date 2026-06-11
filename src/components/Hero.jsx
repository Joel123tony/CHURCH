import { useEffect, useState } from "react";
import axios from "axios";

export default function Hero() {
  const [live, setLive] = useState(false);
  const [videoId, setVideoId] = useState("");

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await axios.get(
          "https://YOUR_RENDER_URL.onrender.com/api/live"
        );

        setLive(res.data.live);
        setVideoId(res.data.videoId);
      } catch (err) {
        setLive(false);
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 15000);

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

          <p className="leading-8">
            Methodist Tamil Church serves the local community through worship, prayer, biblical teaching, discipleship, fellowship, and outreach ministries.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mt-8">

            <div className="bg-cream text-primary p-5 rounded-xl">
              <h3 className="font-bold">Address</h3>
              <p>No. 1, Vandiamman Koil Street, Mogappair East, Chennai</p>
            </div>

            <div className="bg-cream text-primary p-5 rounded-xl">
              <h3 className="font-bold">Languages</h3>
              <p>Tamil / English</p>
            </div>

          </div>
        </div>

        {/* RIGHT SIDE - LIVE CARD */}
        <div className="bg-cream rounded-3xl p-4 text-primary">

          {!live ? (
            <div className="bg-white rounded-2xl h-72 flex items-center justify-center">
              <p className="text-gray-500 font-semibold">
                No Live Stream Right Now
              </p>
            </div>
          ) : (
            <iframe
              className="w-full h-72 rounded-2xl"
              src={`https://www.youtube.com/embed/${videoId}`}
              allowFullScreen
            />
          )}

          <div className="flex justify-between mt-4 items-center">
            <span className="font-bold">
              {live ? "🔴 Live Now" : "Live Now"}
            </span>

            <button className="bg-primary text-white px-4 py-2 rounded-full">
              YouTube
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}