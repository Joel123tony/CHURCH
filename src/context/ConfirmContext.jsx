import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { FaExclamationTriangle, FaQuestionCircle } from "react-icons/fa";

const ConfirmContext = createContext(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}

export function ConfirmProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    isDanger: false,
    resolve: null,
  });

  const confirm = (options = {}) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || "Confirmation Required",
        message: options.message || "Are you sure you want to proceed?",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        isDanger: options.isDanger !== false,
        resolve,
      });
    });
  };

  const handleClose = (value) => {
    if (modalState.resolve) {
      modalState.resolve(value);
    }
    setModalState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

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
  }, [modalState.isOpen]);

  const confirmButtonRef = useRef(null);

  // Focus confirm button for easy keyboard access
  useEffect(() => {
    if (modalState.isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [modalState.isOpen]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modalState.isOpen && (
        <div
          onClick={() => handleClose(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 transition-all duration-300 animate-scaleIn"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                  modalState.isDanger ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                }`}
              >
                {modalState.isDanger ? (
                  <FaExclamationTriangle size={20} />
                ) : (
                  <FaQuestionCircle size={20} />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                  {modalState.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {modalState.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-50 pt-4">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition"
              >
                {modalState.cancelText}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={() => handleClose(true)}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition ${
                  modalState.isDanger
                    ? "bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-100"
                    : "bg-[#54091b] hover:bg-[#6b0c22] active:bg-[#400714]"
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
