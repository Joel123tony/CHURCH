import { useState } from "react";
import PrayerRequestModal from "./PrayerRequestModal";

import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaEnvelope,
  FaPrayingHands,
  FaMapMarkerAlt,
} from "react-icons/fa";

export default function Contact() {
  const [showPrayerModal, setShowPrayerModal] = useState(false);

  return (
    <>
      <section
        id="contact"
        className="bg-primary py-20 lg:py-28"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-cream">
              Contact Us
            </h2>

            <div className="w-24 h-1 bg-cream mx-auto mt-4 rounded-full" />

            <p className="text-cream/80 mt-6 max-w-2xl mx-auto">
              We'd love to hear from you. Reach out for worship,
              fellowship, prayer requests, or any questions.
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Address */}
            <div className="bg-cream rounded-3xl p-8 shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
              <div className="w-14 h-14 bg-primary text-cream rounded-2xl flex items-center justify-center mb-6">
                <FaMapMarkerAlt size={24} />
              </div>

              <h3 className="text-2xl font-bold text-primary mb-4">
                Visit Us
              </h3>

              <p className="text-gray-700 leading-7 flex-grow">
                No.1 Vandiamman Koil Street,
                <br />
                Mogappair East,
                <br />
                Chennai - 600107
              </p>

              <button
                onClick={() =>
                  window.open(
                    "https://maps.app.goo.gl/Q8ZBoqhSdgZkzqy18",
                    "_blank"
                  )
                }
                className="mt-6 bg-primary text-cream py-3 px-6 rounded-full font-medium hover:opacity-90 transition"
              >
                Get Directions
              </button>
            </div>

            {/* Email */}
            <div className="bg-cream rounded-3xl p-8 shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
              <div className="w-14 h-14 bg-primary text-cream rounded-2xl flex items-center justify-center mb-6">
                <FaEnvelope size={24} />
              </div>

              <h3 className="text-2xl font-bold text-primary mb-4">
                Email Us
              </h3>

              <p className="text-gray-700 break-words flex-grow">
                methodistchurch1975@gmail.com
              </p>

              <a
                href="mailto:methodistchurch1975@gmail.com"
                className="mt-6 bg-primary text-cream py-3 px-6 rounded-full text-center font-medium hover:opacity-90 transition"
              >
                Send Email
              </a>
            </div>

            {/* Prayer Request */}
            <div className="bg-cream rounded-3xl p-8 shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
              <div className="w-14 h-14 bg-primary text-cream rounded-2xl flex items-center justify-center mb-6">
                <FaPrayingHands size={24} />
              </div>

              <h3 className="text-2xl font-bold text-primary mb-4">
                Prayer Request
              </h3>

              <p className="text-gray-700 leading-7 flex-grow">
                “Call to me and I will answer you and tell you great and
                unsearchable things you do not know.”
                <br />
                <span className="font-semibold">
                  Jeremiah 33:3
                </span>
              </p>

              <button
                onClick={() => setShowPrayerModal(true)}
                className="mt-6 bg-primary text-cream py-3 px-6 rounded-full font-medium hover:opacity-90 transition"
              >
                Submit Request
              </button>
            </div>

          </div>

          {/* Social Section */}
          <div className="mt-16 text-center">

            <h3 className="text-2xl font-semibold text-cream mb-6">
              Connect With Us
            </h3>

            <div className="flex justify-center gap-5">

              <a
                href="https://facebook.com/profile.php?id=61582424267282"
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 bg-cream text-primary rounded-full flex items-center justify-center hover:scale-110 transition"
              >
                <FaFacebookF size={20} />
              </a>

              <a
                href="https://www.instagram.com/methodist_chruch_padikuppam/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 bg-cream text-primary rounded-full flex items-center justify-center hover:scale-110 transition"
              >
                <FaInstagram size={20} />
              </a>

              <a
                href="https://www.youtube.com/@MethodistChurchPadikuppam"
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 bg-cream text-primary rounded-full flex items-center justify-center hover:scale-110 transition"
              >
                <FaYoutube size={20} />
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