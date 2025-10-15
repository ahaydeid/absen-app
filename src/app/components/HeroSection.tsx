"use client";

import Image from "next/image";

export default function HeroSection() {
  return (
    <div className="top-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="mx-auto flex items-center justify-between px-3 md:px-6 py-2 md:py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-16 md:h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            <Image src="/logo.png" alt="Logo Sekolah" width={64} height={64} className="object-contain w-full h-full" />
          </div>
        </div>

        {/* Tanggal */}
        <p className="text-xs sm:text-sm md:text-lg font-bold text-gray-800 mb-0 md:mb-3 text-center flex-1">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        {/* Guru */}
        <div className="flex flex-col items-end flex-shrink-0 text-right pr-2 md:pr-3">
          <div className="text-gray-900 font-extrabold text-sm md:text-lg leading-tight">Ahadi</div>
          <div className="text-gray-700 text-xs md:text-base">Coding</div>
        </div>

        {/* Foto Guru */}
        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 ml-2">
          <Image src="/profile.png" alt="Foto Guru" width={56} height={56} className="object-cover w-full h-full" />
        </div>
      </div>
    </div>
  );
}
