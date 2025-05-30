"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  message = "Are you sure you want to clear all history?",
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const modalContent = (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 pointer-events-none"
      style={{ WebkitBackdropFilter: "blur(4px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <motion.div
        className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg max-w-[90vw] sm:max-w-sm w-full mx-auto max-h-[80vh] overflow-auto border border-gray-200 dark:border-gray-700 shadow-xl pointer-events-auto"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Confirm Action
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">{message}</p>
        <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm sm:text-base"
            aria-label="Cancel action"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm sm:text-base"
            aria-label="Confirm action"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return null;
  return createPortal(<AnimatePresence>{isOpen && modalContent}</AnimatePresence>, modalRoot);
};

export default ConfirmModal;