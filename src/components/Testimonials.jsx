import React, { useEffect, useState, memo } from "react";
import { getBlock } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { FadeUp, StaggerContainer, StaggerItem } from "./animations/index.jsx";

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
function MessageCard({ item, index, t }) {
  return (
    <article
      className={`group relative flex flex-col h-full overflow-hidden rounded-[24px] bg-white border border-[#d8cbb7] p-8 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]`}
    >
      {/* Decorative top border highlight on hover */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ee0039] to-[#54091b] opacity-40 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Quote Icon */}
      <svg className="w-10 h-10 text-[#ee0039]/25 mb-6 transition-colors duration-300 group-hover:text-[#ee0039]/40" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H10c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14H24c0-1.1.9-2 2-2V8z" />
      </svg>

      {/* Quote */}
      <p className="flex-1 text-base leading-relaxed text-[#54091b] mb-8 font-medium">
        "{t(item.quote)}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-4 pt-5 border-t border-slate-100/60">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#54091b]/10 text-base font-bold text-[#54091b] ring-1 ring-[#54091b]/10 group-hover:bg-[#54091b]/15 transition-colors duration-300 shadow-sm">
          {getInitials(item.author) || "?"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-[#54091b] transition-colors duration-300 group-hover:text-[#54091b]">
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
const Testimonials = memo(function Testimonials() {
  const [data, setData] = useState({ messages: [] });
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    getBlock("pastor-messages")
      .then((res) => { if (res?.data) setData(res.data); })
      .catch((err) => console.warn("Failed to load pastor messages", err))
      .finally(() => setLoading(false));
  }, []);

  const allMessages = Array.isArray(data?.messages) ? data.messages : [];
  const items = allMessages.filter((item) => item.visible !== false);

  const isEmpty = !loading && items.length === 0;

  return (
    <section
      id="pastor-message"
      className="py-16 overflow-hidden bg-[#F4EFE7]"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

        {/* ── Heading ── */}
        <FadeUp>
          <div className="mb-6 lg:mb-8">
            <h2 className="text-3xl font-bold text-[#54091b]">
              {t("Pastor's Message")}
            </h2>
          </div>
        </FadeUp>

        {/* ── Content area ── */}
        <div className="pb-16 lg:pb-24">

          {/* Loading skeleton */}
          {loading && (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-5 px-5 scroll-pl-5 after:content-[''] after:w-[1px] after:shrink-0 sm:after:hidden sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:snap-none sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-52 shrink-0 w-[85vw] max-w-[340px] sm:w-auto snap-start animate-pulse rounded-3xl shadow-sm bg-[#e5ddd3]"
                />
              ))}
            </div>
          )}

          {/* Cards */}
          {!loading && items.length > 0 && (
            <StaggerContainer
              className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-5 px-5 scroll-pl-5 after:content-[''] after:w-[1px] after:shrink-0 sm:after:hidden sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:snap-none sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((item, i) => (
                <StaggerItem 
                  key={item.id || i} 
                  animation="fade-up"
                  className="shrink-0 w-[85vw] max-w-[340px] sm:w-auto snap-start h-auto"
                >
                  <MessageCard
                    item={item}
                    index={i}
                    t={t}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {/* Empty state — plain, matches site tone */}
          {isEmpty && (
            <FadeUp>
              <p
                className="text-center text-base text-[#54091b]/90"
              >
                {t("No messages yet.")}
              </p>
            </FadeUp>
          )}

        </div>
      </div>
    </section>
  );
});

export default Testimonials;
