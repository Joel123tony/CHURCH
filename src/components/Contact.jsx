import { useState } from "react";
import PrayerRequestModal from "./PrayerRequestModal";

import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaEnvelope,
  FaPrayingHands,
} from "react-icons/fa";
export default function Contact() {
  const [showPrayerModal, setShowPrayerModal] =
    useState(false);

  return (
    <>
      <section className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-3xl font-bold text-cream mb-10">
            Contact
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            {/* ADDRESS */}
            <div className="bg-cream text-primary p-8 rounded-3xl">
              <h3 className="text-2xl font-bold mb-4">
                Reach Us Anytime
              </h3>

              <p>
                No.1 Vandiamman Koil Street,
                Mogappair East,
                Chennai - 600107
              </p>
            </div>

            {/* MAIL */}
      <div className="bg-cream text-primary p-8 rounded-3xl flex flex-col items-center justify-center text-center">
  <div className="flex items-center gap-3 mb-6">
    <FaEnvelope className="text-2xl" />
    <h3 className="text-2xl font-bold">Mail</h3>
  </div>

  <a
    href="mailto:methodistchruch1992@gmail.com"
    className="bg-primary text-cream px-6 py-2 rounded-full inline-block"
  >
    Send
  </a>
</div>
            {/* PRAYER REQUEST */}
           <div className="bg-cream text-primary p-8 rounded-3xl flex flex-col items-center justify-center text-center">
  <div className="flex items-center gap-3 mb-6">
    <FaPrayingHands className="text-2xl" />
    <h3 className="text-2xl font-bold">
      Prayer Request
    </h3>
  </div>

  <button
    onClick={() => setShowPrayerModal(true)}
    className="bg-primary text-cream px-6 py-2 rounded-full"
  >
    Request
  </button>
</div>            {/* SOCIAL ICONS */}

<div className="grid md:grid-cols-3 gap-8">
  
  </div> {/* End Grid */}

<div className="flex justify-center items-center gap-4 mt-8">
  <a
    href="facebook.com/profile.php?id=61582424267282"
    className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:scale-110 transition"
  >
    <FaFacebookF />
  </a>

  <a
    href="https://www.instagram.com/methodist_chruch_padikuppam/"
    className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:scale-110 transition"
  >
    <FaInstagram />
  </a>

  <a
    href="https://www.youtube.com/@MethodistChurchPadikuppam"
    className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:scale-110 transition"
  >
    <FaYoutube />
  </a>
</div>

          </div>
        </div>
      </section>

      {/* MODAL */}
      <PrayerRequestModal
        isOpen={showPrayerModal}
        onClose={() =>
          setShowPrayerModal(false)
        }
        
      />
    </>
    
  );
}