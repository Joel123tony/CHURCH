import { useState } from "react";
import PrayerRequestModal from "./PrayerRequestModal";
import DonationModal from "./DonationModal";
import { useLanguage } from "../context/LanguageContext";
import { HandCoins } from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaEnvelope,
  FaPrayingHands,
  FaMapMarkerAlt,
} from "react-icons/fa";

export default function Contact({ theme = "light" }) {
  const { t } = useLanguage();

  const isDark = theme === "dark";

  // Dynamic Theme Classes
  const sectionBg = isDark ? "bg-[#54091b]" : "bg-[#F4EFE7]";
  const headingText = isDark ? "text-[#F4EFE7]" : "text-[#54091b]";
  // In the dark theme variant (for Resource pages), the cards should be cream colored.
  const cardBg = isDark ? "bg-[#F4EFE7] shadow-xl" : "bg-white border-0 border-transparent shadow-xl";
  const cardHeading = "text-[#54091b]"; // Both themes use maroon text on their respective light cards
  const cardText = "text-[#54091b]";
  // User explicitly requested cream background and maroon icon for dark theme cards, but since the card is cream, we will give the icon a subtle border or use white bg if they meant inverse. Actually, let's use the requested maroon icon.
  const iconBox = isDark ? "bg-white text-[#54091b] shadow-sm" : "bg-[#54091b] text-[#F4EFE7]";
  // User requested "Dark maroon background, Cream text" for buttons
  const actionBtn = "bg-[#54091b] text-[#F4EFE7] hover:bg-[#7A2533] hover:shadow-lg";
  const socialBtn = isDark
    ? "bg-[#F4EFE7] text-[#54091b] hover:bg-white"
    : "bg-white text-[#54091b]";
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);

  return (
    <>
      <section id="contact" className={`py-16 transition-colors duration-300 ${sectionBg}`}>
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mb-6 lg:mb-8">
            <h2 className={`text-3xl font-bold ${headingText}`}>
              {t("Contact Us")}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 lg:gap-5">
            <div className={`flex flex-col h-full rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6 ${cardBg}`}>
              <div className={`mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBox}`}>
                <FaMapMarkerAlt size={18} />
              </div>

              <h3 className={`mb-4 text-lg sm:text-xl font-bold ${cardHeading}`}>
                {t("Visit Us")}
              </h3>

              <p className={`flex-grow leading-[1.7] text-sm sm:text-[15px] max-w-[280px] ${cardText}`}>
                <span className="font-semibold">{t("No.1 Vandiamman Koil Street, Mogappair East, Chennai - 600107")}</span>
                <br /><br />
                {t("Visit our church and worship with us. We warmly welcome everyone to experience God's love and fellowship.")}
              </p>

              <button
                onClick={() =>
                  window.open("https://maps.app.goo.gl/Q8ZBoqhSdgZkzqy18", "_blank")
                }
                className={`mt-8 relative overflow-hidden inline-flex w-full sm:w-auto items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 sm:mt-auto sm:px-6 sm:text-[15px] group/btn ${actionBtn}`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t("Get Directions")}
                </span>
              </button>
            </div>

            <div className={`flex flex-col h-full rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6 ${cardBg}`}>
              <div className={`mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBox}`}>
                <FaEnvelope size={18} />
              </div>

              <h3 className={`mb-4 text-lg sm:text-xl font-bold ${cardHeading}`}>
                {t("Email Us")}
              </h3>

              <p className={`flex-grow break-words leading-[1.7] text-sm sm:text-[15px] max-w-[280px] ${cardText}`}>
                <span className="font-semibold">methodistchurch1975@gmail.com</span>
                <br /><br />
                {t("Reach out to us for prayer requests, ministry inquiries, or any questions. We're happy to hear from you.")}
              </p>

              <a
                href="mailto:methodistchurch1975@gmail.com"
                className={`mt-8 relative overflow-hidden inline-flex w-full sm:w-auto items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 sm:mt-auto sm:px-6 sm:text-[15px] group/btn ${actionBtn}`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t("Send Email")}
                </span>
              </a>
            </div>

            <div className={`flex flex-col h-full rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6 ${cardBg}`}>
              <div className={`mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBox}`}>
                <FaPrayingHands size={18} />
              </div>

              <h3 className={`mb-4 text-lg sm:text-xl font-bold ${cardHeading}`}>
                {t("Prayer Request")}
              </h3>

              <p className={`flex-grow leading-[1.7] text-sm sm:text-[15px] max-w-[280px] ${cardText}`}>
                {t("Call to me and I will answer you and tell you great and unsearchable things you do not know.")}
                <br /><br />
                <span className="font-semibold">{t("Jeremiah 33:3")}</span>
              </p>

              <button
                onClick={() => setShowPrayerModal(true)}
                className={`mt-8 relative overflow-hidden inline-flex w-full sm:w-auto items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 sm:mt-auto sm:px-6 sm:text-[15px] group/btn ${actionBtn}`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t("Request To Pray")}
                </span>
              </button>
            </div>

            <div className={`group flex flex-col h-full rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6 ${cardBg}`}>
              <div className={`mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBox}`}>
                <HandCoins size={24} />
              </div>

              <h3 className={`mb-4 text-lg sm:text-xl font-bold ${cardHeading}`}>
                {t("Support Our Ministry")}
              </h3>

              <p className={`flex-grow leading-[1.7] text-sm sm:text-[15px] max-w-[280px] ${cardText}`}>
                {t("Your generous giving helps support worship services, outreach programs, church maintenance, and community ministries.")} <br /><br />
                {t("Thank you for partnering with us.")}
              </p>

              <button
                onClick={() => setShowDonationModal(true)}
                className={`mt-8 relative overflow-hidden inline-flex w-full sm:w-auto items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 sm:mt-auto sm:px-6 sm:text-[15px] group/btn ${actionBtn}`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t("Donate")}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-10 text-center sm:mt-12">
            <h3 className={`mb-4 sm:mb-5 text-lg sm:text-xl font-semibold ${headingText}`}>
              {t("Connect With Us")}
            </h3>

            <div className="flex justify-center gap-3 sm:gap-4">
              <a
                href="https://facebook.com/profile.php?id=61582424267282"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-110 sm:h-12 sm:w-12 ${socialBtn}`}
              >
                <FaFacebookF size={16} />
              </a>

              <a
                href="https://www.instagram.com/methodist_chruch_padikuppam/"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-110 sm:h-12 sm:w-12 ${socialBtn}`}
              >
                <FaInstagram size={16} />
              </a>

              <a
                href="https://www.youtube.com/@MethodistChurchPadikuppam"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-110 sm:h-12 sm:w-12 ${socialBtn}`}
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

      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
    </>
  );
}
