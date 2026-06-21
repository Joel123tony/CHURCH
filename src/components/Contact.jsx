import { useState } from "react";
import PrayerRequestModal from "./PrayerRequestModal";
import { useLanguage } from "../context/LanguageContext";

import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaEnvelope,
  FaPrayingHands,
  FaMapMarkerAlt,
} from "react-icons/fa";

export default function Contact() {
  const { t } = useLanguage();
  const [showPrayerModal, setShowPrayerModal] = useState(false);

  return (
    <>
      <section id="contact" className="bg-primary py-12 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-xl text-left sm:mb-10">
            <h2 className="text-2xl font-bold text-cream sm:text-3xl lg:text-4xl">
              {t("contact.title")}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            <div className="flex flex-col rounded-3xl bg-cream p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 sm:p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-cream">
                <FaMapMarkerAlt size={18} />
              </div>

              <h3 className="mb-3 text-lg font-bold text-primary sm:text-xl">
                {t("contact.visitUs")}
              </h3>

              <p
                className="flex-grow leading-7 text-sm sm:text-[15px]"
                style={{ color: "var(--color-primary)" }}
              >
                No.1 Vandiamman Koil Street,
                <br />
                Mogappair East,
                <br />
                Chennai - 600107
                
              </p>
            
              <button
                onClick={() =>
                  window.open("https://maps.app.goo.gl/Q8ZBoqhSdgZkzqy18", "_blank")
                }
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-cream transition hover:opacity-90 sm:mt-6 sm:px-6 sm:py-2.5 sm:text-sm"
              >
                {t("contact.directions")}
              </button>
            </div>

            <div className="flex flex-col rounded-3xl bg-cream p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 sm:p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-cream">
                <FaEnvelope size={18} />
              </div>

              <h3 className="mb-3 text-lg font-bold text-primary sm:text-xl">
                {t("contact.emailUs")}
              </h3>

              <p
                className="flex-grow break-words text-sm sm:text-[15px]"
                style={{ color: "var(--color-primary)" }}
              >
                methodistchurch1975@gmail.com
              </p>

              <a
                href="mailto:methodistchurch1975@gmail.com"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-cream transition hover:opacity-90 sm:mt-6 sm:px-6 sm:py-2.5 sm:text-sm"
              >
                {t("contact.sendEmail")}
              </a>
            </div>

            <div className="flex flex-col rounded-3xl bg-cream p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 sm:p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-cream">
                <FaPrayingHands size={18} />
              </div>

              <h3 className="mb-3 text-lg font-bold text-primary sm:text-xl">
                {t("contact.prayerRequest")}
              </h3>

              <p
                className="flex-grow leading-7 text-sm sm:text-[15px]"
                style={{ color: "var(--color-primary)" }}
              >
                {t("contact.prayerQuote")}
                <br />
                <span className="font-semibold">{t("contact.prayerReference")}</span>
              </p>

              <button
                onClick={() => setShowPrayerModal(true)}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-cream transition hover:opacity-90 sm:mt-6 sm:px-6 sm:py-2.5 sm:text-sm"
              >
                {t("contact.submitRequest")}
              </button>
            </div>
          </div>

          <div className="mt-10 text-center sm:mt-12">
            <h3 className="mb-4 text-lg font-semibold text-cream sm:mb-5 sm:text-xl">
              {t("contact.connect")}
            </h3>

            <div className="flex justify-center gap-3 sm:gap-4">
              <a
                href="https://facebook.com/profile.php?id=61582424267282"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-primary transition hover:scale-110 sm:h-12 sm:w-12"
              >
                <FaFacebookF size={16} />
              </a>

              <a
                href="https://www.instagram.com/methodist_chruch_padikuppam/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-primary transition hover:scale-110 sm:h-12 sm:w-12"
              >
                <FaInstagram size={16} />
              </a>

              <a
                href="https://www.youtube.com/@MethodistChurchPadikuppam"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-primary transition hover:scale-110 sm:h-12 sm:w-12"
              >
                <FaYoutube size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <PrayerRequestModal
        isOpen={showPrayerModal}
        onClose={() => setShowPrayerModal(false)}
      />
    </>
  );
}
