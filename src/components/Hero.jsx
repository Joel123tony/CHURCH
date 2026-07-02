import { useCallback, useEffect, useRef, useState } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

export default function Hero() {
  const { t, cmsData } = useLanguage();
  const styles = cmsData?.hero?.styles || {};

  const [video, setVideo] = useState({
    videoId: "",
    title: "",
  });

  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchYoutubeVideo = useCallback(async () => {
    try {
      const res = await API.get("/youtube");
      const data = res?.data || {};

      setVideo({
        videoId: data?.videoId || "",
        title: data?.title || "",
      });
    } catch (err) {
      console.error("Hero API error:", err);
      setVideo({ videoId: "", title: "" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchYoutubeVideo();

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      void fetchYoutubeVideo();
    }, 60000);

    return () => clearInterval(intervalRef.current);
  }, [fetchYoutubeVideo]);

  return (
    <section id="hero" className="py-16 text-white" style={{ backgroundColor: styles.backgroundColor || "#54091b" }}>
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <h1 className="mb-6 text-5xl font-bold leading-tight" style={{ color: styles.headingColor || "#F4EFE7" }}>
            {t("hero.heading")}
          </h1>

          <p className="text-lg leading-8" style={{ color: styles.subheadingColor || "#F4EFE7" }}>
            {t("hero.description")}
          </p>
        </div>

        <div className="group rounded-3xl bg-cream p-4 shadow-2xl transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_30px_70px_rgba(0,0,0,0.22)]">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black transition-transform duration-700 ease-out group-hover:scale-[1.01]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <p className="font-semibold text-gray-500">{t("hero.loading")}</p>
              </div>
            ) : !video.videoId ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <p className="font-semibold text-gray-500">{t("hero.noVideo")}</p>
              </div>
            ) : (
              <iframe
                className="absolute left-0 top-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                title={video.title || "YouTube Video"}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            )}
          </div>

          <div className="mt-4 flex items-center justify-between transition-transform duration-500 ease-out group-hover:translate-y-0.5">
            <span className="font-bold text-primary">
              {video.videoId ? `🔴 ${t("hero.latestSermon")}` : t("hero.noVideoShort")}
            </span>

            <a
              href={
                video.videoId
                  ? `https://www.youtube.com/watch?v=${video.videoId}`
                  : "https://www.youtube.com/@MethodistChurchPadikuppam"
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-full px-5 py-2 font-medium transition ${video.videoId
                  ? "hover:opacity-90"
                  : "hover:opacity-90"
                }`}
              style={{ backgroundColor: styles.buttonBackground || "#54091b", color: styles.buttonTextColor || "#FFFFFF" }}
            >
              {video.videoId ? `▶ ${t("hero.watchYoutube")}` : t("hero.watchOnYoutube")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
