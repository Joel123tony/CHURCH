import { FiX, FiCheckCircle, FiXCircle, FiClock, FiUser, FiMail, FiPhone, FiCreditCard } from "react-icons/fi";
import { formatCurrency } from "../../utils/formatCurrency";

const InfoRow = ({ label, value, icon: Icon, isCopyable }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    {Icon && <Icon className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />}
    <div className="flex-1">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-sm font-medium ${isCopyable ? "inline-block break-all rounded bg-slate-50 p-1 font-mono text-slate-600" : "text-slate-800"}`}>
        {value || "—"}
      </p>
    </div>
  </div>
);

export default function DonationDetailsModal({ donation, isOpen, onClose }) {
  if (!isOpen || !donation) return null;

  const isSuccess = donation.paymentStatus === "Successful";
  const isFailed = donation.paymentStatus === "Failed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
        <div className="flex items-center justify-between bg-[#531B24] px-6 py-4">
          <h2 className="text-lg font-bold text-[#F4EFE7]">Transaction Details</h2>
          <button
            onClick={onClose}
            className="text-[#F4EFE7]/70 transition-colors hover:text-white"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="mb-6 border-b border-slate-100 pb-6 text-center">
            <span className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isSuccess ? "bg-green-100 text-green-700" :
              isFailed ? "bg-red-100 text-red-700" :
              "bg-orange-100 text-orange-700"
            }`}>
              {isSuccess && <FiCheckCircle size={14} />}
              {isFailed && <FiXCircle size={14} />}
              {!isSuccess && !isFailed && <FiClock size={14} />}
              {donation.paymentStatus}
            </span>
            <h1 className="text-4xl font-bold text-slate-900">
              {formatCurrency(donation.amount)}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(donation.transactionDate).toLocaleString()}
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="mb-2 mt-4 text-sm font-bold text-[#531B24]">Donor Information</h3>
            <div className="mb-4 rounded-xl bg-slate-50 p-4">
              <InfoRow label="Name" value={donation.name} icon={FiUser} />
              <InfoRow label="Email" value={donation.email} icon={FiMail} />
              <InfoRow label="Phone" value={donation.phone} icon={FiPhone} />
            </div>

            <h3 className="mb-2 mt-6 text-sm font-bold text-[#531B24]">Payment Information</h3>
            <div className="rounded-xl bg-slate-50 p-4">
              <InfoRow label="Razorpay Payment ID" value={donation.razorpayPaymentId} icon={FiCreditCard} isCopyable />
              <InfoRow label="Razorpay Order ID" value={donation.razorpayOrderId} isCopyable />
              <InfoRow label="Payment Method" value={donation.paymentMethod || "Razorpay"} />
              <InfoRow label="Currency" value={donation.currency || "INR"} />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
