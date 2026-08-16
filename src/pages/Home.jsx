import { useEffect, useState } from "react";
import Hero from "../components/Hero";
import History from "../components/History";
import Events from "../components/Events";
import Gallery from "../components/Gallery";
import Pastor from "../components/Pastor";
import YoutubeSection from "../components/YoutubeSection";
import Testimonials from "../components/Testimonials";
import { useLanguage } from "../context/LanguageContext";
import { getHomePage } from "../services/api";
import DateTime from "../components/DateTime";

export default function Home() {
  const { t } = useLanguage();
  const [sectionOrder, setSectionOrder] = useState(["hero", "history", "events", "gallery", "pastor", "testimonials", "youtube"]);
  const [sectionData, setSectionData] = useState({});
  const [homeData, setHomeData] = useState(null);

  useEffect(() => {
    document.title = t("MTC Padikuppam");
  }, [t]);

  // Load aggregated homepage data in ONE optimized request
  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        const res = await getHomePage();
        if (!isMounted || !res) return;

        setHomeData(res);
        window.initialHomepageDataReady = true;
        window.dispatchEvent(new Event("homepageDataReady"));

        // Process section order
        const loadedArray = res.sectionOrder;
        if (loadedArray && loadedArray.length > 0) {
          const defaultMiddle = ["history", "events", "gallery", "pastor", "testimonials", "youtube"];
          const savedMiddle = loadedArray.filter((sec) => defaultMiddle.includes(sec));
          const unsaved = defaultMiddle.filter((sec) => !savedMiddle.includes(sec));

          let finalMiddle = [...savedMiddle];
          unsaved.forEach((sec) => {
            const canonIdx = defaultMiddle.indexOf(sec);
            const predecessors = defaultMiddle.slice(0, canonIdx).reverse();
            const afterIdx = predecessors.reduce((found, pred) => {
              if (found !== -1) return found;
              const i = finalMiddle.indexOf(pred);
              return i !== -1 ? i : -1;
            }, -1);
            if (afterIdx !== -1) {
              finalMiddle.splice(afterIdx + 1, 0, sec);
            } else {
              const successors = defaultMiddle.slice(canonIdx + 1);
              const beforeIdx = successors.reduce((found, succ) => {
                if (found !== -1) return found;
                const i = finalMiddle.indexOf(succ);
                return i !== -1 ? i : -1;
              }, -1);
              if (beforeIdx !== -1) {
                finalMiddle.splice(beforeIdx, 0, sec);
              } else {
                finalMiddle.push(sec);
              }
            }
          });

          setSectionOrder(["hero", ...finalMiddle]);
        }

        // Process section block styles/content
        setSectionData({
          hero: res.hero || {},
          history: res.history || {},
          events: res.eventsContent || {},
          gallery: res.galleryContent || {},
          pastor: res.pastorContent || {},
          testimonials: res.testimonialsContent || {},
          youtube: res.youtubeContent || {}
        });
      } catch (err) {
        console.warn("Failed to load aggregated home page data", err);
      }
    };

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderSection = (id) => {
    const blockData = sectionData[id] || {};
    const styles = blockData.styles || {};

    let styleBlock = null;
    const hasStyles = styles && Object.values(styles).some(val => val);
    if (hasStyles) {
      const selectors = [];
      if (styles.backgroundColor) {
        selectors.push(`.cms-sec-${id} { background-color: ${styles.backgroundColor} !important; }`);
        selectors.push(`.cms-sec-${id} section, .cms-sec-${id} footer { background-color: ${styles.backgroundColor} !important; }`);
        selectors.push(`.cms-sec-${id} .bg-primary, .cms-sec-${id} .bg-cream { background-color: ${styles.backgroundColor} !important; }`);
      }
      if (styles.textColor) {
        selectors.push(`.cms-sec-${id} { color: ${styles.textColor} !important; }`);
        selectors.push(`.cms-sec-${id} section, .cms-sec-${id} footer { color: ${styles.textColor} !important; }`);
        selectors.push(`.cms-sec-${id} p { color: ${styles.textColor} !important; }`);
      }
      if (styles.headingColor) {
        selectors.push(`.cms-sec-${id} h1, .cms-sec-${id} h2, .cms-sec-${id} h3, .cms-sec-${id} h4 { color: ${styles.headingColor} !important; }`);
      }
      if (styles.paragraphColor) {
        selectors.push(`.cms-sec-${id} p { color: ${styles.paragraphColor} !important; }`);
      }
      if (styles.linkColor) {
        selectors.push(`.cms-sec-${id} a { color: ${styles.linkColor} !important; }`);
      }
      if (styles.cardBg) {
        selectors.push(`.cms-sec-${id} .bg-white, .cms-sec-${id} .bg-\\[\\#F4EFE7\\]\\/40, .cms-sec-${id} .bg-\\[\\#f4efe7\\] { background-color: ${styles.cardBg} !important; }`);
      }
      if (styles.cardTextColor) {
        selectors.push(`.cms-sec-${id} .bg-white *, .cms-sec-${id} .bg-\\[\\#F4EFE7\\]\\/40 *, .cms-sec-${id} .bg-\\[\\#f4efe7\\] * { color: ${styles.cardTextColor} !important; }`);
      }
      if (styles.cardBorderColor) {
        selectors.push(`.cms-sec-${id} .border { border-color: ${styles.cardBorderColor} !important; }`);
      }
      if (styles.cardShadow) {
        const shadowValues = {
          none: "none",
          "shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          shadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          "shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          "shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          "shadow-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          "shadow-2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        };
        selectors.push(`.cms-sec-${id} .shadow-2xl, .cms-sec-${id} .shadow-sm, .cms-sec-${id} .shadow-md, .cms-sec-${id} .shadow { box-shadow: ${shadowValues[styles.cardShadow]} !important; }`);
      }
      if (selectors.length > 0) {
        styleBlock = <style dangerouslySetInnerHTML={{ __html: selectors.join("\n") }} />;
      }
    }

    switch (id) {
      case "hero":
        return (
          <div key={id} className={`cms-sec-${id}`}>
            {styleBlock}
            <Hero initialVideo={homeData?.youtubeHero} waitForData={true} />
          </div>
        );
      case "history":
        return (
          <div key={id} className={`cms-sec-${id}`}>
            {styleBlock}
            <History />
          </div>
        );
      case "events":
        return (
          <div key={id} className={`cms-sec-${id}`}>
            {styleBlock}
            <Events initialEvents={homeData?.events} waitForData={true} />
          </div>
        );
      case "gallery":
        return (
          <div key={id} className={`cms-sec-${id}`}>
            {styleBlock}
            <Gallery initialGallery={homeData?.gallery} waitForData={true} />
          </div>
        );
      case "pastor":
        return (
          <div key={id} className={`cms-sec-${id}`}>
            {styleBlock}
            <Pastor initialPastors={homeData?.pastors} waitForData={true} />
          </div>
        );
      case "testimonials":
        return (
          <div key={id} className={`cms-sec-${id}`}>
            {styleBlock}
            <Testimonials />
          </div>
        );
      case "youtube":
        return (
          <div key={id} className={`cms-sec-${id}`}>
            {styleBlock}
            <YoutubeSection initialVideos={homeData?.youtubeLatest} waitForData={true} />
          </div>
        );
      default:
        return null;
    }
  };

  const renderLayout = () => {
    return sectionOrder.map((secId) => renderSection(secId));
  };

  return (
    <>
      <div id="home" className="bg-[#F4EFE7] border-b border-[#54091b]/10 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <h1 className="text-2xl sm:text-[26px] font-bold text-center sm:text-left text-[#54091b]">
            {t("Holy Life , Gospel Ministry")}
          </h1>
          <DateTime className="shrink-0" />
        </div>
      </div>

      {renderLayout()}
    </>
  );
}
