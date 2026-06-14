import { useState } from "react";
import PrayerRequestModal from "./PrayerRequestModal";

export default function Contact() {
  const [showPrayerModal, setShowPrayerModal] =
    useState(false);

  return (
    <>
      <section className="bg-cream py-16">
        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-3xl font-bold text-primary mb-10">
            Contact
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            {/* ADDRESS */}
            <div className="bg-primary text-white p-8 rounded-3xl">
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
            <div className="bg-primary text-white p-8 rounded-3xl">
              <h3 className="text-2xl font-bold mb-4">
                Mail
              </h3>

              <a
                href="mailto:yourchurch@gmail.com"
                className="bg-cream text-primary px-6 py-2 rounded-full inline-block"
              >
                Send
              </a>
            </div>

            {/* PRAYER REQUEST */}
            <div className="bg-primary text-white p-8 rounded-3xl">
              <h3 className="text-2xl font-bold mb-4">
                Prayer Request
              </h3>

              <button
                onClick={() =>
                  setShowPrayerModal(true)
                }
                className="bg-cream text-primary px-6 py-2 rounded-full"
              >
                Request
              </button>
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