import { useState } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { useAlert } from "../context/ConfirmContext";

export default function PrayerRequestModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [request, setRequest] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

    await API.post("/prayer-requests", {
  name,
  phone,
  request,
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
      alert({
        title: "❌ Submit Failed",
        message: "Failed to submit prayer request. Please try again.",
        buttonText: "OK"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-primary mb-6">
          {t("Prayer Request")}
        </h2>

        {success && (
          <div className="mb-4 bg-green-100 border border-green-500 text-green-700 px-4 py-3 rounded-xl">
            {t("Prayer Request Submitted Successfully")}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t("Name")}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-xl p-3"
          />

          <input
            type="text"
            placeholder={t("Phone Number (Optional)")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-xl p-3"
          />

          <textarea
            rows="5"
            placeholder={t("Prayer Request")}
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
              {loading ? t("Submitting...") : t("Submit Request")}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 border rounded-xl"
            >
              {t("Close")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
