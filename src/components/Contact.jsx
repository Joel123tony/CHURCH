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
      <section id="contact" className="py-16 bg-[#54091b]">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mb-6 lg:mb-8">
            <h2 className="text-3xl font-bold text-[#F4EFE7]">
              {t("Contact Us")}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            <div
              className="flex flex-col rounded-3xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 sm:p-6 bg-[#F4EFE7] border-0 border-transparent"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#54091b] text-[#F4EFE7]">
                <FaMapMarkerAlt size={18} />
              </div>

              <h3 className="mb-3 text-lg sm:text-xl font-bold text-[#54091b]">
                {t("Visit Us")}
              </h3>

              <p className="flex-grow leading-7 text-sm sm:text-[15px] text-[#54091b]">
                {t("No.1 Vandiamman Koil Street, Mogappair East, Chennai - 600107")}
              </p>

              <button
                onClick={() =>
                  window.open("https://maps.app.goo.gl/Q8ZBoqhSdgZkzqy18", "_blank")
                }
                className="mt-5 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition hover:opacity-90 sm:mt-6 sm:px-6 sm:py-2.5 sm:text-sm bg-[#54091b] text-[#F4EFE7]"
              >
                {t("Get Directions")}
              </button>
            </div>

            <div
              className="flex flex-col rounded-3xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 sm:p-6 bg-[#F4EFE7] border-0 border-transparent"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#54091b] text-[#F4EFE7]">
                <FaEnvelope size={18} />
              </div>

              <h3 className="mb-3 text-lg sm:text-xl font-bold text-[#54091b]">
                {t("Email Us")}
              </h3>

              <p className="flex-grow break-words text-sm sm:text-[15px] text-[#54091b]">
                methodistchurch1975@gmail.com
              </p>

              <a
                href="mailto:methodistchurch1975@gmail.com"
                className="mt-5 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition hover:opacity-90 sm:mt-6 sm:px-6 sm:py-2.5 sm:text-sm bg-[#54091b] text-[#F4EFE7]"
              >
                {t("Send Email")}
              </a>
            </div>

            <div
              className="flex flex-col rounded-3xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 sm:p-6 bg-[#F4EFE7] border-0 border-transparent"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#54091b] text-[#F4EFE7]">
                <FaPrayingHands size={18} />
              </div>

              <h3 className="mb-3 text-lg sm:text-xl font-bold text-[#54091b]">
                {t("Prayer Request")}
              </h3>

              <p className="flex-grow leading-7 text-sm sm:text-[15px] text-[#54091b]">
                {t("Call to me and I will answer you and tell you great and unsearchable things you do not know.")}
                <br />
                <span className="font-semibold">{t("Jeremiah 33:3")}</span>
              </p>

              <button
                onClick={() => setShowPrayerModal(true)}
                className="mt-5 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition hover:opacity-90 sm:mt-6 sm:px-6 sm:py-2.5 sm:text-sm bg-[#54091b] text-[#F4EFE7]"
              >
                {t("Submit Request")}
              </button>
            </div>
          </div>

          <div className="mt-10 text-center sm:mt-12">
            <h3 className="mb-4 sm:mb-5 text-lg sm:text-xl font-semibold text-[#F4EFE7]">
              {t("Connect With Us")}
            </h3>

            <div className="flex justify-center gap-3 sm:gap-4">
              <a
                href="https://facebook.com/profile.php?id=61582424267282"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-110 sm:h-12 sm:w-12 bg-[#F4EFE7] text-[#54091b]"
              >
                <FaFacebookF size={16} />
              </a>

              <a
                href="https://www.instagram.com/methodist_chruch_padikuppam/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-110 sm:h-12 sm:w-12 bg-[#F4EFE7] text-[#54091b]"
              >
                <FaInstagram size={16} />
              </a>

              <a
                href="https://www.youtube.com/@MethodistChurchPadikuppam"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-110 sm:h-12 sm:w-12 bg-[#F4EFE7] text-[#54091b]"
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
