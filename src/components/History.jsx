import { useLanguage } from "../context/LanguageContext";

export default function History() {
  const { t, cmsData } = useLanguage();
  const styles = cmsData?.history?.styles || {};

  const imgSrcOverride = t("history.image");
  const imgSrc = (imgSrcOverride && imgSrcOverride !== "history.image")
    ? imgSrcOverride
    : "https://res.cloudinary.com/dhqc0n23k/image/upload/v1781002196/church_wfthtv.png";

  return (
    <section id="church-history" className="overflow-hidden" style={{ backgroundColor: styles.backgroundColor || "#F4EFE7" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="pt-16 lg:pt-24">
          <h2 className="text-3xl font-bold mb-6 lg:mb-8" style={{ color: styles.headingColor || "#54091b" }}>
            {t("history.title")}
          </h2>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 xl:gap-24 items-start mt-8 lg:mt-10">
          <div className="order-1">
            <div className="max-w-2xl lg:pr-8">
              <p className="text-base md:text-lg leading-8 md:leading-9" style={{ color: styles.textColor || "#54091b" }}>
                {t("history.paragraph1")}
              </p>

              <p className="mt-5 text-base md:text-lg leading-8 md:leading-9" style={{ color: styles.textColor || "#54091b" }}>
                {t("history.paragraph2")}
              </p>

              <p className="mt-5 text-base md:text-lg leading-8 md:leading-9" style={{ color: styles.textColor || "#54091b" }}>
                {t("history.paragraph3")}
              </p>
            </div>
          </div>

          <div className="order-2 flex justify-center lg:justify-end lg:self-end mt-6 lg:mt-0">
            <img
              src={imgSrc}
              alt={t("history.alt")}
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
