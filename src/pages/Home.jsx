import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import History from "../components/History";
import Events from "../components/Events";
import Gallery from "../components/Gallery";
import Pastor from "../components/Pastor";
import Contact from "../components/Contact";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="bg-[#F4EFE7]">

      {/* NAVBAR */}
      <Navbar />

      {/* PAGE CONTENT */}
      <div className="pt-20">

        {/* HOME */}
        <section id="home" className="scroll-mt-24">
          <Hero />
        </section>

        {/* HISTORY */}
        <section id="history" className="scroll-mt-24">
          <History />
        </section>

        {/* EVENTS */}
        <section id="events" className="scroll-mt-24">
          <Events />
        </section>

        {/* GALLERY */}
        <section id="gallery" className="scroll-mt-24">
          <Gallery />
        </section>

        {/* PASTOR */}
        <section id="pastor" className="scroll-mt-24">
          <Pastor />
        </section>

        {/* CONTACT */}
        <section id="contact" className="scroll-mt-24">
          <Contact />
        </section>

        {/* FOOTER */}
        <Footer />

      </div>

    </div>
  );
}