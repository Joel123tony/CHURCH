import { useEffect, useState } from "react";
import API from "../api/axios";

export default function YoutubeSection() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const res = await API.get("/youtube/latest");

      console.log("YouTube API:", res.data);

      setVideos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("YouTube Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-primary mb-10">
          YouTube
        </h2>

        {loading ? (
          <div className="text-center text-primary">
            Loading videos...
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center text-primary">
            No videos found
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                  <img
                    src={
                      video.thumbnail ||
                      `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
                    }
                    alt={video.title}
                    className="w-full h-56 object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                    }}
                  />

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 line-clamp-2">
                      {video.title}
                    </h3>

                    {video.publishedAt && (
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(
                          video.publishedAt
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}