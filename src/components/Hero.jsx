import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

const Hero = memo(function Hero({ initialVideo }) {
  const { t } = useLanguage();

  const [video, setVideo] = useState(() => {
    if (initialVideo) {
      return {
        videoId: initialVideo.videoId || "",
        title: initialVideo.title || "",
      };
    }
    return { videoId: "", title: "" };
  });

  const [loading, setLoading] = useState(() => !initialVideo);
  const intervalRef = useRef(null);

  const fetchYoutubeVideo = useCallback(async () => {
    try {
      const res = await API.get("/youtube");
      const data = res?.data || {};

      setVideo((prev) => {
        const newVideoId = data?.videoId || "";
        const newTitle = data?.title || "";
        if (prev.videoId === newVideoId && prev.title === newTitle) {
          return prev;
        }
        return { videoId: newVideoId, title: newTitle };
      });
    } catch {
      setVideo((prev) => {
        if (prev.videoId === "" && prev.title === "") return prev;
        return { videoId: "", title: "" };
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialVideo) {
      setVideo({
        videoId: initialVideo.videoId || "",
        title: initialVideo.title || "",
      });
      setLoading(false);
    } else {
      void fetchYoutubeVideo();
    }

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      void fetchYoutubeVideo();
    }, 60000);

    return () => clearInterval(intervalRef.current);
  }, [fetchYoutubeVideo, initialVideo]);

  return (
    <section id="hero" className="py-16 text-white bg-[#54091b]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h1 className="mb-6 leading-tight text-4xl sm:text-5xl font-bold text-[#F4EFE7] break-words">
            {t("MTC Padikuppam")}
          </h1>

          <p className="leading-8 text-base sm:text-lg text-[#F4EFE7] break-words">
            {t("MTC Padikuppam (Methodist Tamil Church) serves the local community through Christ-centered worship, prayer, and sound biblical teaching. We are committed to making disciples through spiritual growth, meaningful fellowship, and regular Bible study. Our church actively reaches out to the community through various outreach ministries, sharing God's love in practical ways and supporting those in need. Together, we seek to grow in faith, build strong families, and live as faithful followers of Christ, rooted in grace and truth.")}
          </p>
        </div>

        <div className="group min-w-0 rounded-3xl bg-cream p-4 shadow-2xl transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-3xl">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <p className="font-semibold text-gray-500">{t("Loading...")}</p>
              </div>
            ) : !video.videoId ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <p className="font-semibold text-gray-500">{t("No Video Available")}</p>
              </div>
            ) : (
              <iframe
                className="absolute left-0 top-0 h-full w-full"
                src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                title={video.title || "YouTube Video"}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              />
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-bold text-primary text-center sm:text-left break-words">
              {video.videoId ? `🔴 ${t("Latest Sermon")}` : t("No Video")}
            </span>

            <a
              href={
                video.videoId
                  ? `https://www.youtube.com/watch?v=${video.videoId}`
                  : "https://www.youtube.com/@MethodistChurchPadikuppam"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-5 py-2 font-medium transition-opacity duration-200 text-center w-full sm:w-auto break-words bg-[#54091b] text-[#FFFFFF] hover:opacity-90"
            >
              {video.videoId ? `▶ ${t("Watch Video on YouTube")}` : t("Watch on YouTube")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Hero;
