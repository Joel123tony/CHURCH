import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import History from "../components/History";
import Events from "../components/Events";
import Gallery from "../components/Gallery";
import Pastor from "../components/Pastor";
import YoutubeSection from "../components/YoutubeSection";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = t("page.title");
  }, [t]);

  return (
    <div className="bg-[#F4EFE7]">
      <Navbar />

      <main>
        <h1 className="text-2xl font-bold text-center py-10 text-[#5b1320]">
          {t("page.title")}
        </h1>

        <section id="home" className="scroll-mt-24">
          <Hero />
        </section>

        <section id="history" className="scroll-mt-24">
          <History />
        </section>

        <section id="events" className="scroll-mt-24">
          <Events />
        </section>

        <section id="gallery" className="scroll-mt-24">
          <Gallery />
        </section>

        <section id="pastor" className="scroll-mt-24">
          <Pastor />
        </section>

        <section id="youtube" className="scroll-mt-24">
          <YoutubeSection />
        </section>

        <section id="contact" className="scroll-mt-24">
          <Contact />
        </section>

        <Footer />
      </main>
    </div>
  );
}
