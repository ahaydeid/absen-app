"use client";

import React, { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation"; // Import useRouter

interface ConfirmSaveProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: React.ReactNode;
}

export default function ConfirmSave({ isOpen, onClose, onConfirm, title = "Simpan Absen?", description }: ConfirmSaveProps) {
  const [isBusy, setIsBusy] = useState(false);
  const router = useRouter(); // Inisialisasi router

  // body scroll lock + keyboard
  useEffect(() => {
    if (!isOpen) return;

    type KeyHandler = (e: KeyboardEvent) => void;
    const onKey: KeyHandler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && !isBusy) {
        e.preventDefault();
        void handleConfirm();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isBusy, onClose]);

  const handleConfirm = async () => {
    if (isBusy) return;
    try {
      setIsBusy(true);
      await Promise.resolve(onConfirm());
      
      // === Tambahan Logika: Kembali ke Halaman Sebelumnya ===
      onClose(); // Tutup modal
      router.back(); // Panggil fungsi router.back()
      // =======================================================
      
    } catch (error) {
      console.error("Konfirmasi gagal:", error);
      // Anda mungkin ingin tidak menutup modal jika ada error
    } finally {
      setIsBusy(false);
    }
  };

  // animasi framer-motion tetap
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        // overlay wrapper
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial="hidden" animate="visible" exit="exit" variants={overlayVariants} aria-hidden={!isOpen}>
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          {/* modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <div className="p-5">
              {/* === CONFIRM MODE === */}
              <>
                {/* header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
                  </div>

                  <button type="button" aria-label="Tutup" onClick={onClose} className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* body (opsional) */}
                <div className="mt-4 text-sm text-gray-700">{/* Tambah detail jika perlu */}</div>

                {/* actions */}
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-300"
                    disabled={isBusy}
                  >
                    <X className="w-4 h-4" />
                    batal
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-70"
                    disabled={isBusy}
                    autoFocus
                  >
                    <Check className="w-4 h-4" />
                    {isBusy ? "menyimpan..." : "simpan"}
                  </button>
                </div>
              </>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}