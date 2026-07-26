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
      const payload = res?.data;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.value)
          ? payload.value
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      const newVideos = data.slice(0, 4).map((video) => ({
        ...video,
        videoId: video.videoId || video.id || video?.id?.videoId || "",
        title: video.title || video.snippet?.title || "No Title",
      }));

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
          <h2 className="text-3xl font-bold text-[#F4EFE7]">
            {t("youtube")}
          </h2>

        </div>

        {loading ? (
          <div className="text-center text-[#F4EFE7]/70">{t("youtube.loading")}</div>
        ) : videos.length === 0 ? (
          <div className="text-center text-[#F4EFE7]/70">{t("youtube.noVideos")}</div>
        ) : (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 px-4 -mx-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                  className="youtube-card block shrink-0 snap-start w-[300px] sm:w-[340px] md:w-auto"
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
                    <div className="youtube-title !text-[#54091b]" role="heading" aria-level="3">
                      {video.title}
                    </div>

                    {video.publishedAt && (
                      <p className="mt-2 text-sm text-[#F4EFE7]/80 font-medium">
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
