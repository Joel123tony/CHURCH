import React, { memo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { FadeLeft, FadeRight, FadeUp } from "./animations/index.jsx";

const History = memo(function History() {
  const { t } = useLanguage();

  const imgSrcOverride = null;
  const imgSrc = imgSrcOverride
    ? imgSrcOverride
    : "https://res.cloudinary.com/dhqc0n23k/image/upload/v1781002196/church_wfthtv.png";

  const cmsContentText = null;
  const cmsContent = cmsContentText ? t(cmsContentText) : null;
  const hasCmsContent = !!cmsContent;

  const paragraphs = hasCmsContent
    ? []
    : [
        t("From 1975 to 1983, the ministry led by Rev. Y. Moses Selvaraj played a significant role in the remarkable growth and development of the church. Under his dedicated leadership, the church expanded both in strength and in spiritual vision, with ministries growing steadily and purposefully."),
        t("During this period, the ministry at Padikuppam was initiated, marking an important step in the church's mission outreach. The vision was to extend God's work beyond the local congregation, establishing a strong presence across major districts and surrounding regions."),
        t("This foundation helped the church grow in faith, unity, and outreach, shaping its mission for future generations.")
      ];

  return (
    <section id="history" className="overflow-hidden bg-[#F4EFE7]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="pt-16 lg:pt-24">
          <FadeUp>
            <h2 className="mb-6 lg:mb-8 text-3xl font-bold text-[#54091b]">
              {t("Church History")}
            </h2>
          </FadeUp>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 xl:gap-24 items-start mt-8 lg:mt-10">
          <div className="order-1 min-w-0">
            <FadeRight delay={150}>
              <div className="max-w-2xl lg:pr-8 min-w-0 break-words">
                {hasCmsContent ? (
                  <p 
                    className="leading-8 md:leading-9 whitespace-pre-line text-base md:text-lg text-[#54091b]"
                  >
                    {cmsContent}
                  </p>
                ) : (
                  paragraphs.map((text, idx) => (
                    <p
                      key={idx}
                      className={`${idx > 0 ? "mt-5 " : ""}leading-8 md:leading-9 text-base md:text-lg text-[#54091b]`}
                    >
                      {text}
                    </p>
                  ))
                )}
              </div>
            </FadeRight>
          </div>

          <div className="order-2 flex justify-center lg:justify-end lg:self-end mt-6 lg:mt-0">
            <FadeLeft delay={300}>
              <img
                src={imgSrc}
                alt={t("Methodist Tamil Church")}
                loading="lazy"
                decoding="async"
                className="
                  block
                  w-full
                  max-w-[300px]
                  sm:max-w-[360px]
                  md:max-w-[430px]
                  lg:max-w-[520px]
                  xl:max-w-[600px]
                  h-auto
                  object-contain
                  drop-shadow-[0_30px_60px_rgba(0,0,0,0.18)]
                  lg:translate-y-10
                "
              />
            </FadeLeft>
          </div>
        </div>
      </div>
    </section>
  );
});

export default History;
