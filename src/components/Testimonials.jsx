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
function MessageCard({ item, index, visible, styles, t }) {
  return (
    <article
      style={{
        animationDelay: `${index * 90}ms`,
        backgroundColor: styles.cardBackground || "#FFFFFF",
      }}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-[#5b1320]/10 p-7 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-3xl ${visible ? "animate-event-card-in" : "opacity-0"}`}
    >
      {/* Subtle corner tint */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-[4rem] transition-all duration-300"
        style={{ backgroundColor: `${styles.cardTitleColor || "#5b1320"}0A` }}
      />

      {/* Opening quote mark */}
      <span
        aria-hidden="true"
        className="mb-3 block select-none font-serif text-6xl leading-none"
        style={{ color: `${styles.cardTitleColor || "#5b1320"}33` }}
      >
        &ldquo;
      </span>

      {/* Quote */}
      <p className={`flex-1 italic leading-7 ${styles.bodyFontSize || "text-[15px]"}`} style={{ color: styles.bodyTextColor || "#475569" }}>
        {t(item.quote)}
      </p>

      {/* Divider */}
      <div className="my-5 h-px bg-gradient-to-r from-transparent via-current to-transparent" style={{ color: `${styles.cardTitleColor || "#5b1320"}33` }} />

      {/* Author */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2"
          style={{ backgroundColor: styles.cardTitleColor || "#5b1320", color: styles.cardBackground || "#FFFFFF", ringColor: `${styles.cardTitleColor || "#5b1320"}33` }}
        >
          {getInitials(item.author) || "?"}
        </div>
        <div className="min-w-0">
          <p className={`truncate ${styles.cardTitleFontSize || "text-sm"} ${styles.cardTitleFontWeight || "font-bold"}`} style={{ color: styles.cardTitleColor || "#5b1320" }}>
            {item.author}
          </p>
          {item.role && (
            <span
              className={`mt-0.5 inline-block rounded-full px-2 py-0.5 font-semibold ${styles.metadataFontSize || "text-[11px]"}`}
              style={{ backgroundColor: `${styles.metadataColor || "#5b1320"}1A`, color: styles.metadataColor || "#5b1320" }}
            >
              {t(item.role)}
            </span>
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
  const styles = cmsData?.testimonials?.styles || {};

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
      className="py-16 overflow-hidden"
      style={{ backgroundColor: styles.backgroundColor || "#F4EFE7" }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

        {/* ── Heading ── */}
        <div className="mb-6 lg:mb-8">
          <h2 className={`${styles.sectionTitleFontSize || "text-3xl"} ${styles.sectionTitleFontWeight || "font-bold"}`} style={{ color: styles.sectionTitleColor || "#54091b" }}>
            {cmsData?.testimonials?.title || t("Pastor's Message")}
          </h2>
          {cmsData?.testimonials?.subtitle && (
            <p className={`mt-2 ${styles.subtitleFontSize || "text-base"}`} style={{ color: styles.subtitleColor || "#1E293B" }}>
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
                  className="h-52 animate-pulse rounded-3xl shadow-sm"
                  style={{ backgroundColor: styles.cardBackground || "#FFFFFF" }}
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
                  styles={styles}
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
                color: styles.textColor || "#1E293B",
              }}
              className="text-center text-base"
            >
              {t("No messages yet.")}
            </p>
          )}

        </div>
      </div>
    </section>
  );
}
