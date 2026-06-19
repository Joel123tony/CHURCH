import { useState } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

export default function PrayerRequestModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [request, setRequest] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await API.post("/prayer/format", {
        requests: [{ name, request, phone }],
        mode: "en-ta",
      });

      setSuccess(true);
      setName("");
      setPhone("");
      setRequest("");

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Prayer submit error:", err);
      alert("Failed to submit prayer request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-primary mb-6">
          {t("contact.prayerRequest")}
        </h2>

        {success && (
          <div className="mb-4 bg-green-100 border border-green-500 text-green-700 px-4 py-3 rounded-xl">
            {t("prayerModal.success")}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t("prayerModal.name")}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-xl p-3"
          />

          <input
            type="text"
            placeholder={t("prayerModal.phone")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-xl p-3"
          />

          <textarea
            rows="5"
            placeholder={t("prayerModal.request")}
            required
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            className="w-full border rounded-xl p-3"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 rounded-xl"
            >
              {loading ? t("prayerModal.submitting") : t("contact.submitRequest")}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 border rounded-xl"
            >
              {t("prayerModal.close")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
