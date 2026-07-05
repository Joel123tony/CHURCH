import React, { useEffect, useRef, useState } from "react";
import { getBlock } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

// ─── Reveal hook (same threshold as other sections) ───────────────────────────
function useSectionReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// ─── Avatar initials ──────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Single message card ──────────────────────────────────────────────────────
function MessageCard({ item, index, visible, t }) {
  return (
    <article
      style={{ animationDelay: `${index * 90}ms` }}
      className={`group relative flex flex-col overflow-hidden rounded-[24px] bg-white border border-slate-100 p-8 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] ${visible ? "animate-event-card-in" : "opacity-0"}`}
    >
      {/* Decorative top border highlight on hover */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ee0039] to-[#54091b] opacity-40 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Quote Icon */}
      <svg className="w-10 h-10 text-[#ee0039]/25 mb-6 transition-colors duration-300 group-hover:text-[#ee0039]/40" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H10c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14H24c0-1.1.9-2 2-2V8z" />
      </svg>

      {/* Quote */}
      <p className="flex-1 text-base leading-relaxed text-slate-600 mb-8 font-medium">
        "{t(item.quote)}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-4 pt-5 border-t border-slate-100/60">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#54091b]/5 text-base font-bold text-[#54091b] ring-1 ring-[#54091b]/10 group-hover:bg-[#54091b]/10 transition-colors duration-300 shadow-sm">
          {getInitials(item.author) || "?"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900 transition-colors duration-300 group-hover:text-[#54091b]">
            {item.author}
          </p>
          {item.role && (
            <p className="truncate text-sm font-semibold text-[#ee0039] mt-0.5">
              {t(item.role)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Testimonials() {
  const [data, setData] = useState({ messages: [] });
  const [loading, setLoading] = useState(true);
  const { ref: sectionRef, visible } = useSectionReveal();
  const { t, cmsData } = useLanguage();

  useEffect(() => {
    getBlock("pastor-messages")
      .then((res) => { if (res?.data) setData(res.data); })
      .catch((err) => console.warn("Failed to load pastor messages", err))
      .finally(() => setLoading(false));
  }, []);

  const allMessages = Array.isArray(data?.messages) ? data.messages : [];
  const items = allMessages.filter((item) => item.visible !== false);

  const isEmpty = !loading && items.length === 0;

  // Grid columns based on card count — matches site's grid patterns
  const gridCols =
    items.length === 1
      ? "lg:grid-cols-1 max-w-xl mx-auto"
      : items.length === 2
        ? "lg:grid-cols-2 max-w-3xl mx-auto"
        : "lg:grid-cols-3";

  return (
    <section
      id="pastor-message"
      ref={sectionRef}
      className="py-16 overflow-hidden bg-[#F4EFE7]"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

        {/* ── Heading ── */}
        <div className="mb-6 lg:mb-8">
          <h2 className="text-3xl font-bold text-[#54091b]">
            {cmsData?.testimonials?.title || t("Pastor's Message")}
          </h2>
          {cmsData?.testimonials?.subtitle && (
            <p className="mt-2 text-base text-[#1E293B]">
              {cmsData.testimonials.subtitle}
            </p>
          )}
        </div>

        {/* ── Content area ── */}
        <div className="pb-16 lg:pb-24">

          {/* Loading skeleton */}
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-52 animate-pulse rounded-3xl shadow-sm bg-[#FFFFFF]"
                />
              ))}
            </div>
          )}

          {/* Cards */}
          {!loading && items.length > 0 && (
            <div
              className={`grid gap-6 sm:grid-cols-2 ${gridCols}`}
            >
              {items.map((item, i) => (
                <MessageCard
                  key={item.id || i}
                  item={item}
                  index={i}
                  visible={visible}
                  t={t}
                />
              ))}
            </div>
          )}

          {/* Empty state — plain, matches site tone */}
          {isEmpty && (
            <p
              style={{
                opacity: visible ? 1 : 0,
                transition: "opacity 0.5s ease",
              }}
              className="text-center text-base text-[#1E293B]"
            >
              {t("No messages yet.")}
            </p>
          )}

        </div>
      </div>
    </section>
  );
}
