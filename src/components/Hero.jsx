import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

const Hero = memo(function Hero({ initialVideo, waitForData }) {
  const { t } = useLanguage();

  const [video, setVideo] = useState(() => {
    if (initialVideo) {
      return {
        videoId: initialVideo.videoId || "",
        title: initialVideo.title || "",
        live: Boolean(initialVideo.live),
      };
    }
    return { videoId: "", title: "", live: false };
  });

  const [loading, setLoading] = useState(() => !initialVideo);
  const [showVideo, setShowVideo] = useState(false);
  const intervalRef = useRef(null);
  const observerRef = useRef(null);

  const iframeCallbackRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    
    if (node) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (node.contentWindow) {
              const action = entry.isIntersecting ? "playVideo" : "pauseVideo";
              node.contentWindow.postMessage(
                JSON.stringify({ event: "command", func: action, args: "" }),
                "*"
              );
            }
          });
        },
        { threshold: 0.1 }
      );
      
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  const fetchYoutubeVideo = useCallback(async () => {
    try {
      const res = await API.get("/youtube");
      const data = res?.data || {};

      setVideo((prev) => {
        const newVideoId = data?.videoId || "";
        const newTitle = data?.title || "";
        const newLive = Boolean(data?.live);
        if (prev.videoId === newVideoId && prev.title === newTitle && prev.live === newLive) {
          return prev;
        }
        return { videoId: newVideoId, title: newTitle, live: newLive };
      });
    } catch {
      setVideo((prev) => {
        if (prev.videoId === "" && prev.title === "") return prev;
        return { videoId: "", title: "", live: false };
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
        live: Boolean(initialVideo.live),
      });
      setLoading(false);
    } else {
      if (!waitForData) {
        void fetchYoutubeVideo();
      }
    }

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (waitForData && !initialVideo) return;
      void fetchYoutubeVideo();
    }, 60000);

    return () => clearInterval(intervalRef.current);
  }, [fetchYoutubeVideo, initialVideo, waitForData]);

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
                <p className="font-semibold text-gray-500">{t("Offline")}</p>
              </div>
            ) : !showVideo ? (
              <div 
                className="absolute inset-0 cursor-pointer flex items-center justify-center group"
                onClick={() => setShowVideo(true)}
              >
                <img
                  src={`https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`}
                  alt={video.title}
                  loading="lazy"
                  onError={(e) => { e.target.src = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`; }}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition duration-300"></div>
                <div className="relative z-10 flex items-center justify-center w-16 h-12 bg-red-600 rounded-xl shadow-xl transition-transform duration-300 group-hover:scale-110">
                  <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                {video.live && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 backdrop-blur-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                    <span className="text-xs font-bold tracking-wider text-white">LIVE</span>
                  </div>
                )}
              </div>
            ) : (
              <iframe
                ref={iframeCallbackRef}
                className="absolute left-0 top-0 h-full w-full"
                src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}`}
                title={video.title || "YouTube Video"}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              />
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-bold text-primary text-center sm:text-left break-words flex items-center justify-center sm:justify-start gap-2">
              {loading ? (
                t("Checking Live Status...")
              ) : video.live ? (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-red-600">🔴 {t("LIVE NOW")}</span>
                </>
              ) : video.videoId ? (
                `▶ ${t("Latest Sermon")}`
              ) : (
                t("Offline")
              )}
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
