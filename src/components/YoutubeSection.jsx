import { useEffect, useState } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

export default function YoutubeSection() {
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVideos = async () => {
    try {
      const res = await API.get("/youtube/latest");
      const data = Array.isArray(res.data) ? res.data : [];
      setVideos(data.slice(0, 4));
    } catch (err) {
      console.error("YouTube Error:", err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVideos();
  }, []);

  return (
    <section className="py-16 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-primary mb-10">
          {t("youtube.title")}
        </h2>

        {loading ? (
          <div className="text-center text-primary">{t("youtube.loading")}</div>
        ) : videos.length === 0 ? (
          <div className="text-center text-primary">{t("youtube.noVideos")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="bg-primary rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="relative overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-56 object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        e.target.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                      }}
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-cream line-clamp-2">
                      {video.title}
                    </h3>

                    {video.publishedAt && (
                      <p className="text-sm text-cream/80 mt-2">
                        {new Date(video.publishedAt).toLocaleDateString()}
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
