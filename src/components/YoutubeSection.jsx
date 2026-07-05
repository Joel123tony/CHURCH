import { useEffect, useState } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

export default function YoutubeSection() {
  const { t, cmsData } = useLanguage();
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
    <section id="Youtube" className="py-16 bg-[#54091b]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="mb-6 lg:mb-8">
          <h2 className="text-3xl font-bold text-white">
            {cmsData?.youtube?.title || t("youtube")}
          </h2>
          {cmsData?.youtube?.subtitle && (
            <p className="mt-2 text-base text-white/80">
              {cmsData.youtube.subtitle}
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center text-white/70">{t("youtube.loading")}</div>
        ) : videos.length === 0 ? (
          <div className="text-center text-white/70">{t("youtube.noVideos")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <a
                key={video.videoId || video.title}
                href={
                  video.videoId
                    ? `https://www.youtube.com/watch?v=${video.videoId}`
                    : "https://www.youtube.com/@MethodistChurchPadikuppam"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-[#F4EFE7]">
                  <div className="relative overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-56 object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        if (video.videoId) {
                          e.target.src = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
                        }
                      }}
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="line-clamp-2 text-base font-semibold !text-[#531B24]">
                      {video.title}
                    </h3>

                    {video.publishedAt && (
                      <p className="mt-2 text-sm text-[#54091b]">
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
