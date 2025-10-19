"use client";

import React, { useEffect } from "react";
import { X, Check } from "lucide-react";


interface ConfirmSaveProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: React.ReactNode;
}

export default function ConfirmSave({ isOpen, onClose, onConfirm, title = "Simpan Absen?", description }: ConfirmSaveProps) {
  useEffect(() => {
    if (!isOpen) return;

    type KeyHandler = (e: KeyboardEvent) => void;

    const onKey: KeyHandler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onConfirm();
    };

    // disable body scroll saat modal terbuka
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    // overlay wrapper
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" aria-hidden={!isOpen}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-sm bg-white rounded-lg shadow-xl ring-1 ring-black/5 overflow-hidden"
        onClick={(e) => e.stopPropagation()} // cegah klik di dalam modal menutup
      >
        <div className="p-5">
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

          {/* body (opsional — bisa ditambahkan detail) */}
          <div className="mt-4 text-sm text-gray-700">{/* kalau mau tambahin pesan detail, bisa disisipkan di sini */}</div>

          {/* actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-300">
              <X className="w-4 h-4" />
              batal
            </button>

            <button
              type="button"
              onClick={() => {
                onConfirm();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-300"
              autoFocus
            >
              <Check className="w-4 h-4" />
              simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
