import React, { useState, useEffect } from "react";
import { FaLaptop, FaTabletAlt, FaMobileAlt, FaChevronLeft, FaChevronRight, FaRedo, FaLock } from "react-icons/fa";
import Hero from "../../components/Hero";
import History from "../../components/History";
import Events from "../../components/Events";
import Gallery from "../../components/Gallery";
import Pastor from "../../components/Pastor";
import YoutubeSection from "../../components/YoutubeSection";
import Books from "../../components/Books";
import Contact from "../../components/Contact";
import Footer from "../../components/Footer";
import { getBlock } from "../../services/api";

// Custom premium testimonials section to show off Nested repeatable blocks
function TestimonialsSection({ data }) {
  const allMessages = Array.isArray(data?.messages) ? data.messages : [
    { author: "Rev. John Wesley", quote: "Welcome to our church community. We are glad to have you.", role: "Pastor", visible: true },
    { author: "Sarah Jenkins", quote: "A warm and welcoming church. The sermons are deeply biblical and relevant.", role: "Member", visible: true }
  ];
  const visibleMessages = allMessages.filter(item => item.visible !== false);
  const limit = data?.maxVisible !== undefined ? Number(data.maxVisible) : 4;
  const items = visibleMessages.slice(0, limit);

  return (
    <section id="pastor-message" className="bg-white py-16 text-slate-800">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-12 text-center text-3xl font-bold text-[#54091b]">Pastor's Message</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div key={item.id || i} className="flex flex-col justify-between rounded-2xl bg-[#F4EFE7]/40 p-6 shadow-sm border border-slate-100 hover:shadow-md transition min-h-[200px]">
              <p className="italic text-slate-600 mb-6 line-clamp-3 overflow-hidden text-ellipsis flex-1">
                "{item.quote || "Empty quote content"}"
              </p>
              <div className="mt-auto border-t border-slate-100/50 pt-3">
                <h4 className="font-bold text-slate-900">{item.author || "Anonymous"}</h4>
                <p className="text-xs text-slate-400">{item.role || "Pastor"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LivePreview({
  sectionOrder = ["hero", "history", "events", "gallery", "pastor", "testimonials", "youtube", "books", "contact", "footer"],
  activeSection = "hero",
  activeFormData = {}
}) {
  const [device, setDevice] = useState(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) return "mobile";
      if (window.innerWidth >= 768 && window.innerWidth < 1024) return "tablet";
    }
    return "desktop";
  });
  const [loadedData, setLoadedData] = useState({});

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const sections = ["hero", "history", "events", "gallery", "pastor", "pastor-messages-draft", "youtube", "books", "contact", "footer"];
        const fetched = {};
        for (const sec of sections) {
          try {
            let fetchKey = sec;
            const res = await getBlock(fetchKey);
            if (res && res.data) {
              // Map pastor-messages-draft to pastor-messages for the component
              const stateKey = sec === "pastor-messages-draft" ? "pastor-messages" : sec;
              fetched[stateKey] = res.data;
            }
          } catch (e) { }
        }
        setLoadedData(fetched);
      } catch (err) { }
    };
    loadAllData();
  }, [activeSection]);

  const getDeviceWidth = () => {
    switch (device) {
      case "tablet":
        return "w-[768px] max-w-full border-x-[12px] border-slate-800 rounded-[32px] shadow-2xl";
      case "mobile":
        return "w-[375px] max-w-full border-x-[12px] border-slate-800 rounded-[32px] shadow-2xl";
      default:
        return "w-full";
    }
  };

  const renderSection = (id) => {
    const isSelected = id === activeSection;
    const blockData = isSelected ? activeFormData : (loadedData[id] || {});
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
        component = <Pastor />;
        break;
      case "testimonials":
        component = <TestimonialsSection data={loadedData["pastor-messages"]} />;
        break;
      case "youtube":
        component = <YoutubeSection />;
        break;
      case "books":
        component = <Books />;
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
      <div key={id} className={`cms-sec-${id} w-full`}>
        {styleBlock}
        {component}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-slate-100">
      {/* Device Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        {/* Browser actions */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="ml-4 flex items-center gap-1 text-xs text-slate-400">
            <FaChevronLeft className="cursor-not-allowed" />
            <FaChevronRight className="cursor-not-allowed" />
            <FaRedo className="cursor-pointer hover:text-slate-600 transition" />
          </div>
        </div>

        {/* Address bar */}
        <div className="mx-4 hidden max-w-md flex-1 items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-400 md:flex">
          <FaLock size={10} className="text-emerald-500" />
          <span className="truncate">https://mtcpadikuppam.org/preview?section={activeSection}</span>
        </div>

        {/* Device toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={`rounded-lg p-2 transition ${device === "desktop" ? "bg-white text-[#54091b] shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
            title="Desktop view"
          >
            <FaLaptop size={14} />
          </button>
          <button
            type="button"
            onClick={() => setDevice("tablet")}
            className={`rounded-lg p-2 transition ${device === "tablet" ? "bg-white text-[#54091b] shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
            title="Tablet view"
          >
            <FaTabletAlt size={14} />
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={`rounded-lg p-2 transition ${device === "mobile" ? "bg-white text-[#54091b] shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
            title="Mobile view"
          >
            <FaMobileAlt size={14} />
          </button>
        </div>
      </div>

      {/* Screen view window */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
        <div
          className={`h-fit bg-[#F4EFE7] overflow-hidden transition-all duration-300 ${getDeviceWidth()}`}
          style={{ minHeight: device === "desktop" ? "100%" : "600px" }}
        >
          {/* Active section highlighted border or full list */}
          <div className="divide-y divide-slate-200">
            {sectionOrder.map((sectionId) => {
              const isSelected = sectionId === activeSection;
              const element = (
                <div
                  key={sectionId}
                  className={`transition-all duration-300 ${isSelected ? "ring-4 ring-offset-2 ring-[#ee0039] relative z-10 shadow-lg" : "opacity-90"
                    }`}
                >
                  {isSelected && (
                    <div className="absolute left-2 top-2 z-20 rounded-md bg-[#ee0039] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                      Editing Section
                    </div>
                  )}
                  {renderSection(sectionId)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
