import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import History from "../components/History";
import Events from "../components/Events";
import Gallery from "../components/Gallery";
import Pastor from "../components/Pastor";
import YoutubeSection from "../components/YoutubeSection";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import Testimonials from "../components/Testimonials";
import { useLanguage } from "../context/LanguageContext";
import { getBlock } from "../services/api";

export default function Home() {
  const { t } = useLanguage();
  const [sectionOrder, setSectionOrder] = useState(["hero", "history", "events", "gallery", "pastor", "testimonials", "contact", "footer"]);
  const [sectionData, setSectionData] = useState({});

  useEffect(() => {
    document.title = t("MTC Padikuppam");
  }, [t]);

  // Load custom section order and dynamic block styles from database
  useEffect(() => {
    const loadOrderAndData = async () => {
      try {
        const res = await getBlock("section-order");
        const orderData = res?.data || [];
        const loadedArray = Array.isArray(orderData) ? orderData : orderData.order;

        if (loadedArray && loadedArray.length > 0) {
          // Always enforce correct relative order for all known middle sections
          const defaultMiddle = ["history", "events", "gallery", "pastor", "testimonials", "contact"];

          // Build the final middle by: keep loaded sections in their saved order,
          // then inject any missing ones at their canonical position.
          const resultMiddle = [...defaultMiddle]; // start from canonical order
          // Re-sort to match the user-saved order where possible
          const savedMiddle = loadedArray.filter(sec => defaultMiddle.includes(sec));
          const unsaved = defaultMiddle.filter(sec => !savedMiddle.includes(sec));

          // Insert each unsaved section at its canonical index
          let finalMiddle = [...savedMiddle];
          unsaved.forEach(sec => {
            const canonIdx = defaultMiddle.indexOf(sec);
            // Find the best insertion point: after the nearest predecessor that exists in finalMiddle
            const predecessors = defaultMiddle.slice(0, canonIdx).reverse();
            const afterIdx = predecessors.reduce((found, pred) => {
              if (found !== -1) return found;
              const i = finalMiddle.indexOf(pred);
              return i !== -1 ? i : -1;
            }, -1);
            if (afterIdx !== -1) {
              finalMiddle.splice(afterIdx + 1, 0, sec);
            } else {
              // No predecessor found — put before first successor that exists
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

          setSectionOrder(["hero", ...finalMiddle, "footer"]);
        } else {
          setSectionOrder(["hero", "history", "events", "gallery", "pastor", "testimonials", "contact", "footer"]);
        }
      } catch (err) {
        console.warn("Failed to load section order, using defaults.", err);
        setSectionOrder(["hero", "history", "events", "gallery", "pastor", "testimonials", "contact", "footer"]);
      }

      // Fetch styles/content for all sections
      try {
        const sections = ["hero", "history", "events", "gallery", "pastor", "testimonials", "contact", "footer"];
        const fetched = {};
        for (const sec of sections) {
          try {
            const res = await getBlock(sec);
            if (res && res.data) {
              fetched[sec] = res.data;
            }
          } catch (e) { }
        }
        setSectionData(fetched);
      } catch (err) {
        console.warn("Failed to load CMS section data styles", err);
      }
    };
    loadOrderAndData();
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

    let component = null;
    switch (id) {
      case "hero":
        component = <Hero />;
        break;
      case "history":
        component = <History />;
        break;
      case "events":
        component = <Events />;
        break;
      case "gallery":
        component = <Gallery />;
        break;
      case "pastor":
        component = (
          <React.Fragment key="pastor-group">
            <Pastor />
            <YoutubeSection />
          </React.Fragment>
        );
        break;
      case "testimonials":
        component = <Testimonials />;
        break;
      case "contact":
        component = <Contact />;
        break;
      case "footer":
        component = <Footer />;
        break;
      default:
        return null;
    }

    return (
      <div key={id} className={`cms-sec-${id}`}>
        {styleBlock}
        {component}
      </div>
    );
  };

  const renderLayout = () => {
    return sectionOrder.map((secId) => renderSection(secId));
  };

  return (
    <div className="bg-[#F4EFE7]">
      <Navbar />

      <main>
        <h1 className="bg-[#F4EFE7] text-2xl font-bold text-center py-10 text-[#5b1320]">
          {t("Holy Life , Gospel Ministry")}
        </h1>

        {renderLayout()}
      </main>
    </div>
  );
}
