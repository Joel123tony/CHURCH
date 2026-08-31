import { useState, useEffect } from "react";
import { FiX, FiCheckCircle, FiAlertCircle, FiHeart, FiLoader } from "react-icons/fi";
import API from "../api/axios";
import { formatCurrency } from "../utils/formatCurrency";
import { useLanguage } from "../context/LanguageContext";

// Helper to load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function DonationModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const presetAmounts = [100, 250, 500, 1000, 2500, 5000];
  
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle', 'success', 'error'
  const [transactionData, setTransactionData] = useState(null);

  // Reset state when opened and preload Razorpay script
  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript(); // Preload to avoid async delay in submit handler
      setAmount(500);
      setCustomAmount("");
      setName("");
      setEmail("");
      setPhone("");
      setError("");
      setStatus("idle");
      setTransactionData(null);
    }
  }, [isOpen]);

  // Global error handlers for debugging mobile issues
  useEffect(() => {
    const handleRejection = (e) => console.error("Unhandled Rejection:", e.reason);
    const handleError = (e) => console.error("Global Error:", e.error);
    
    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);
    
    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  if (!isOpen) return null;

  const handlePresetClick = (val) => {
    setAmount(val);
    setCustomAmount("");
    setError("");
  };

  const handleCustomAmountChange = (e) => {
    const val = e.target.value;
    setCustomAmount(val);
    if (val && !isNaN(val)) {
      setAmount(Number(val));
    } else if (val === "") {
      setAmount(0);
    }
    setError("");
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    if (amount < 10) {
      setError(`${t("Minimum donation amount is")} ${formatCurrency(10)}`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Ensure Razorpay is loaded (usually preloaded by useEffect)
      if (!window.Razorpay) {
        const res = await loadRazorpayScript();
        if (!res) {
          setError(t("Razorpay SDK failed to load. Are you offline?"));
          setLoading(false);
          return;
        }
      }

      // 2. Create Order on Backend
      const orderRes = await API.post("/donations/create-order", {
        amount,
        name,
        email,
        phone
      });

      const order = orderRes.data;

      // 3. Open Razorpay Checkout immediately after order creation
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_mockkey", // Falls back to a mock test key if env not set
        amount: order.amount,
        currency: order.currency || "INR",
        name: t("Methodist Tamil Church"),
        description: t("Donation to Support Our Ministry"),
        image: window.location.origin + "/mtc-logo.png",
        order_id: order.id,
        handler: async function (response) {
          try {
            // 4. Verify Payment on Backend
            const verifyRes = await API.post("/donations/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.status === "success") {
              setTransactionData({
                id: response.razorpay_payment_id,
                amount: amount
              });
              setStatus("success");
            } else {
              setStatus("error");
            }
          } catch (err) {
            console.error(err);
            setStatus("error");
          }
        },
        prefill: {
          ...(name && { name }),
          ...(email && { email }),
          ...(phone && { contact: phone }),
        },
        theme: {
          color: "#531B24", // Church maroon
        },
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on("payment.failed", function (response) {
        console.error("Payment Failed:", response.error);
        setStatus("error");
      });

      paymentObject.open();

    } catch (err) {
      console.error("Razorpay Checkout Error:", err);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
        setError(err.response.data?.error || err.response.data?.message || t("Failed to initiate payment. Please try again."));
      } else {
        setError(err.message || t("Failed to initiate payment. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => !loading && status !== "success" && onClose()}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#F6EFE3] shadow-2xl transition-all">
        
        {/* Header */}
        <div className="bg-[#531B24] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[#F4EFE7]">
            <FiHeart size={20} className="text-[#EFBF04]" />
            <h2 className="text-xl font-bold tracking-wide">{t("Support Our Ministry")}</h2>
          </div>
          {status !== "success" && (
            <button
              onClick={onClose}
              disabled={loading}
              className="text-[#F4EFE7]/70 hover:text-white transition-colors disabled:opacity-50"
            >
              <FiX size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          
          {/* Default Form State */}
          {status === "idle" && (
            <form onSubmit={handleDonate} className="space-y-6">
              
              {/* Amounts */}
              <div>
                <label className="mb-3 block text-sm font-bold text-[#531B24] uppercase tracking-wider">
                  {t("Select Amount")}
                </label>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className={`rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${
                        amount === preset && customAmount === ""
                          ? "border-[#531B24] bg-[#531B24] text-white shadow-md"
                          : "border-[#531B24]/20 bg-white text-[#531B24] hover:border-[#531B24]/50"
                      }`}
                    >
                      {formatCurrency(preset)}
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 relative flex items-center">
                  <span className="absolute left-4 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="10"
                    placeholder={t("Custom Amount")}
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    className={`w-full rounded-xl border-2 bg-white py-3 pl-8 pr-4 font-medium text-slate-800 outline-none transition-all ${
                      customAmount !== ""
                        ? "border-[#531B24] ring-2 ring-[#531B24]/10"
                        : "border-slate-200 focus:border-[#531B24]"
                    }`}
                  />
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-[#531B24] uppercase tracking-wider">
                  {t("Your Details (Optional)")}
                </label>
                
                <input
                  type="text"
                  placeholder={t("Full Name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 px-4 text-sm font-medium text-slate-800 outline-none transition-all focus:border-[#531B24]"
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="email"
                    placeholder={t("Email Address")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 px-4 text-sm font-medium text-slate-800 outline-none transition-all focus:border-[#531B24]"
                  />
                  <input
                    type="tel"
                    placeholder={t("Phone Number")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 px-4 text-sm font-medium text-slate-800 outline-none transition-all focus:border-[#531B24]"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg text-sm font-medium">
                  <FiAlertCircle className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || amount < 10}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#531B24] to-[#7A2533] py-4 text-base font-bold text-white shadow-lg transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin" size={18} />
                    {t("Processing...")}
                  </>
                ) : (
                  <>{t("Donate Securely")} {formatCurrency(amount)}</>
                )}
              </button>
            </form>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="text-center py-6 animate-fadeIn">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                <FiCheckCircle size={40} />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-slate-800">{t("Thank You! ❤️")}</h3>
              <p className="mb-6 text-slate-600">{t("Your donation of")} <strong className="text-slate-800">{formatCurrency(transactionData?.amount)}</strong> {t("has been received successfully.")}</p>
              
              <div className="bg-white rounded-xl p-4 mb-8 border border-slate-100 text-sm">
                <p className="text-slate-500 mb-1">{t("Transaction ID")}</p>
                <p className="font-mono font-bold text-slate-800">{transactionData?.id}</p>
              </div>

              <button
                onClick={onClose}
                className="w-full rounded-xl bg-[#531B24] py-3.5 font-bold text-white transition hover:bg-[#3f141b]"
              >
                {t("Return to Website")}
              </button>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="text-center py-6 animate-fadeIn">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
                <FiAlertCircle size={40} />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-slate-800">{t("Payment Failed")}</h3>
              <p className="mb-8 text-slate-600">{t("We could not process your donation at this time. Please try again or use a different payment method.")}</p>
              
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="w-1/2 rounded-xl border-2 border-slate-200 bg-white py-3.5 font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  {t("Cancel")}
                </button>
                <button
                  onClick={() => setStatus("idle")}
                  className="w-1/2 rounded-xl bg-[#531B24] py-3.5 font-bold text-white transition hover:bg-[#3f141b]"
                >
                  {t("Retry Payment")}
                </button>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
