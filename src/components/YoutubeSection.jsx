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
      console.log("Fetched videos:", res.data);
      const data = Array.isArray(res.data) ? res.data : [];
      const newVideos = data.slice(0, 4);
      setVideos(prev =>
        newVideos.map(video => {
          const prevVideo = prev.find(v => (v.id && v.id === video.id) || (v.videoId && v.videoId === video.videoId));
          return {
            ...prevVideo,
            ...video,
            title: video.title || video.snippet?.title || prevVideo?.title || "No Title"
          };
        })
      );
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

  const getBestThumbnail = (video) => {
    const t = video.snippet?.thumbnails;
    if (!t) return video.thumbnail;
    return t.maxres?.url || t.standard?.url || t.high?.url || t.medium?.url || video.thumbnail;
  };

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
            {videos.map((video, index) => {
              const isLive = video.snippet?.liveBroadcastContent === 'live';
              return (
                <a
                  key={video.videoId || video.title}
                  href={
                    video.videoId
                      ? `https://www.youtube.com/watch?v=${video.videoId}`
                      : "https://www.youtube.com/@MethodistChurchPadikuppam"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="youtube-card block"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="youtube-thumbnail">
                    <img
                      src={getBestThumbnail(video)}
                      alt={video.title}
                      loading="lazy"
                      onError={(e) => {
                        if (video.videoId) {
                          e.target.src = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
                        }
                      }}
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="youtube-play-btn">
                      <svg className="youtube-play-icon" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>

                    {/* Live Badge */}
                    {isLive && (
                      <div className="youtube-live-badge">
                        <span className="youtube-live-dot"></span>
                        LIVE
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="youtube-title !text-[#531B24]" role="heading" aria-level="3">
                      {video.title}
                    </div>

                    {video.publishedAt && (
                      <p className="mt-2 text-sm text-[#54091b]/80 font-medium">
                        {new Date(video.publishedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
