import { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { useAlert } from "../context/ConfirmContext";
import { X, Loader2 } from "lucide-react";

export default function PrayerRequestModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [request, setRequest] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  const nameInputRef = useRef(null);

  // Prevent scrolling when modal is open and focus first input
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        if (nameInputRef.current) nameInputRef.current.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "unset";
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  // Handle Esc key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  // Reset state when closed/opened
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setName("");
      setPhone("");
      setRequest("");
    }
  }, [isOpen]);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-scaleIn">

        {/* Close Button */}
        {!loading && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#54091b]/60 hover:text-[#54091b] hover:bg-[#54091b]/10 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#54091b]/20"
            aria-label={t("Close")}
          >
            <X size={24} />
          </button>
        )}

        <div className="mb-6 pt-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#54091b]">
            {t("Prayer Request")}
          </h2>
        </div>

        {success ? (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-2xl flex flex-col items-center justify-center text-center animate-fadeIn">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="font-bold text-lg">{t("Prayer Request Submitted Successfully")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#54091b] mb-1.5 uppercase tracking-wide">
                {t("Name")}
              </label>
              <input
                ref={nameInputRef}
                type="text"
                placeholder={t("Name")}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl p-3.5 outline-none transition-all focus:border-[#54091b] focus:ring-4 focus:ring-[#54091b]/10 text-slate-900 placeholder-slate-400 font-medium bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#54091b] mb-1.5 uppercase tracking-wide">
                {t("Phone Number (Optional)")}
              </label>
              <input
                type="text"
                placeholder={t("Phone Number (Optional)")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl p-3.5 outline-none transition-all focus:border-[#54091b] focus:ring-4 focus:ring-[#54091b]/10 text-slate-900 placeholder-slate-400 font-medium bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#54091b] mb-1.5 uppercase tracking-wide">
                {t("Prayer Request")}
              </label>
              <textarea
                rows="4"
                placeholder={t("Prayer Request")}
                required
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl p-3.5 outline-none transition-all focus:border-[#54091b] focus:ring-4 focus:ring-[#54091b]/10 text-slate-900 placeholder-slate-400 font-medium bg-slate-50 focus:bg-white resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#54091b] hover:bg-[#7A2533] text-white py-3.5 sm:py-4 rounded-xl font-bold text-base transition-all shadow-[0_8px_20px_rgba(84,9,27,0.2)] hover:shadow-[0_12px_25px_rgba(84,9,27,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {t("Submitting...")}
                  </>
                ) : (
                  t("Submit Request")
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
