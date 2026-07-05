import { useLanguage } from "../context/LanguageContext";

export default function History() {
  const { t, cmsData } = useLanguage();
  const styles = cmsData?.history?.styles || {};

  const imgSrcOverride = cmsData?.history?.image;
  const imgSrc = imgSrcOverride
    ? imgSrcOverride
    : "https://res.cloudinary.com/dhqc0n23k/image/upload/v1781002196/church_wfthtv.png";

  const cmsContentText = cmsData?.history?.content;
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
    <section id="church-history" className="overflow-hidden" style={{ backgroundColor: styles.backgroundColor || "#F4EFE7" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="pt-16 lg:pt-24">
          <h2 className={`mb-6 lg:mb-8 ${styles.sectionTitleFontSize || "text-3xl"} ${styles.sectionTitleFontWeight || "font-bold"}`} style={{ color: styles.sectionTitleColor || "#54091b" }}>
            {cmsData?.history?.title ? t(cmsData.history.title) : t("Church History")}
          </h2>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 xl:gap-24 items-start mt-8 lg:mt-10">
          <div className="order-1">
            <div className="max-w-2xl lg:pr-8">
              {hasCmsContent ? (
                <p 
                  className={`leading-8 md:leading-9 whitespace-pre-line ${styles.bodyFontSize || "text-base md:text-lg"}`}
                  style={{ color: styles.bodyTextColor || "#54091b" }}
                >
                  {cmsContent}
                </p>
              ) : (
                paragraphs.map((text, idx) => (
                  <p
                    key={idx}
                    className={`${idx > 0 ? "mt-5 " : ""}leading-8 md:leading-9 ${styles.bodyFontSize || "text-base md:text-lg"}`}
                    style={{ color: styles.bodyTextColor || "#54091b" }}
                  >
                    {text}
                  </p>
                ))
              )}
            </div>
          </div>

          <div className="order-2 flex justify-center lg:justify-end lg:self-end mt-6 lg:mt-0">
            <img
              src={imgSrc}
              alt={t("Methodist Tamil Church")}
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
          </div>
        </div>
      </div>
    </section>
  );
}
