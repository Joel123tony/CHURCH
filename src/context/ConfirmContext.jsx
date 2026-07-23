import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { FaExclamationTriangle, FaQuestionCircle, FaCheckCircle, FaInfoCircle, FaTimesCircle } from "react-icons/fa";

const ConfirmContext = createContext(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}

export function useAlert() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useAlert must be used within a ConfirmProvider");
  }
  return context.alert;
}

export function ConfirmProvider({ children }) {
  const resolveRef = useRef(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "confirm", // "confirm" or "alert"
    title: "",
    message: "",
    icon: "question", // "question", "warning", "success", "error", "info"
    confirmText: "Confirm",
    cancelText: "Cancel",
    isDanger: false,
    resolve: null,
  });

  const confirm = (options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalState({
        isOpen: true,
        type: "confirm",
        title: options.title || "Confirmation Required",
        message: options.message || "Are you sure you want to proceed?",
        icon: options.isDanger ? "warning" : "question",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        isDanger: options.isDanger !== false,
        resolve,
      });
    });
  };

  const alert = (options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      let defaultIcon = "info";
      if (options.title?.includes("❌")) defaultIcon = "error";
      if (options.title?.includes("✅")) defaultIcon = "success";
      
      setModalState({
        isOpen: true,
        type: "alert",
        title: options.title || "Alert",
        message: options.message || "",
        icon: options.icon || defaultIcon,
        confirmText: options.buttonText || "OK",
        cancelText: "",
        isDanger: false,
        resolve,
      });
    });
  };

  const handleClose = useCallback((value) => {
    if (resolveRef.current) {
      resolveRef.current(value);
      resolveRef.current = null;
    }
    setModalState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, []);

  // Accessibility: Listen to ESC key
  useEffect(() => {
    if (!modalState.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalState.isOpen, handleClose]);

  const confirmButtonRef = useRef(null);

  // Focus confirm button for easy keyboard access
  useEffect(() => {
    if (modalState.isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [modalState.isOpen]);

  const renderIcon = () => {
    const iconClass = "flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-inner";
    
    switch (modalState.icon) {
      case "warning":
        return (
          <div className={`${iconClass} bg-[#54091b]/10 text-[#54091b]`}>
            <FaExclamationTriangle size={24} />
          </div>
        );
      case "error":
        return (
          <div className={`${iconClass} bg-red-100 text-red-600`}>
            <FaTimesCircle size={24} />
          </div>
        );
      case "success":
        return (
          <div className={`${iconClass} bg-green-100 text-green-600`}>
            <FaCheckCircle size={24} />
          </div>
        );
      case "question":
        return (
          <div className={`${iconClass} bg-[#D4AF37]/20 text-[#D4AF37]`}>
            <FaQuestionCircle size={24} />
          </div>
        );
      case "info":
      default:
        return (
          <div className={`${iconClass} bg-[#D4AF37]/20 text-[#D4AF37]`}>
            <FaInfoCircle size={24} />
          </div>
        );
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {modalState.isOpen && (
        <div
          onClick={() => modalState.type === "alert" ? handleClose(true) : handleClose(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md transform overflow-hidden rounded-[16px] bg-[#F4EFE7] p-6 shadow-2xl border border-[#D4AF37]/30 transition-all duration-300 animate-scaleIn"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex flex-col items-center text-center gap-4">
              {renderIcon()}

              <div className="flex-1 w-full">
                <h3 className="text-xl font-bold text-[#54091b] leading-tight">
                  {modalState.title.replace(/❌|✅/g, '').trim()}
                </h3>
                <p className="mt-3 text-base font-medium text-[#54091b]/80 leading-relaxed">
                  {modalState.message}
                </p>
              </div>
            </div>

            <div className={`mt-8 flex ${modalState.type === "confirm" ? "justify-center gap-4" : "justify-center"} border-t border-[#D4AF37]/20 pt-5`}>
              {modalState.type === "confirm" && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="rounded-xl border-2 border-[#54091b]/20 bg-transparent px-6 py-2.5 text-sm font-bold text-[#54091b] hover:bg-[#54091b]/5 active:bg-[#54091b]/10 transition-all duration-200"
                >
                  {modalState.cancelText}
                </button>
              )}
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={() => handleClose(true)}
                className={`rounded-xl px-8 py-2.5 text-sm font-bold text-[#F4EFE7] shadow-lg transition-all duration-200 ${
                  modalState.isDanger
                    ? "bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-600/30"
                    : "bg-[#54091b] hover:bg-[#6b0c22] active:bg-[#400714] shadow-[#54091b]/30"
                }`}
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
