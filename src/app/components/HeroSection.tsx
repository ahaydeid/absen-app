"use client";

import Image from "next/image";

export default function HeroSection() {
  return (
    <div className="top-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            <Image src="/logo.png" alt="Logo Sekolah" width={64} height={64} className="object-contain" />
          </div>
        </div>
        <p className="text-xl ms-10 font-bold text-gray-800 mb-3">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="flex flex-col items-end flex-1 text-right pr-3">
          <div className="text-gray-900 font-extrabold text-lg leading-tight">Ahadi Hadi</div>
          <div className="text-gray-700 text-base">Coding</div>
        </div>

        <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
          <Image src="/profile.png" alt="Foto Guru" width={56} height={56} className="object-cover" />
        </div>
      </div>
    </div>
  );
}
