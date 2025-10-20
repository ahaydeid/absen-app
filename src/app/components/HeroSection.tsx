"use client";

import DateDisplay from "@/components/DateDisplay";
import { User2 } from "lucide-react";

export default function HeroSection() {
  return (
    <>
      <p className="text-xs sm:text-sm md:text-lg font-bold text-gray-800 mb-0 md:mb-3 flex-1">
        <DateDisplay />
      </p>
      <div className="top-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="mx-auto flex items-center justify-between px-3 md:px-6 py-2 md:py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {/* <Image src="/logo.png" alt="Logo Sekolah" width={64} height={64} className="object-contain w-full h-full" /> */}
            </div>
          </div>

          <div className="flex flex-col items-end flex-shrink-0 ml-auto">
            <div className="text-gray-900 font-extrabold text-sm md:text-lg leading-tight">Ahadi</div>
            <div className="text-gray-700 text-xs md:text-base">Coding</div>
          </div>

          {/* Foto Guru */}
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-gray-200 flex-shrink-0 ml-2 bg-gray-600 flex items-center justify-center">
            <User2 className="w-6 h-6 md:w-8 md:h-8 text-white" role="img" aria-label="Foto Guru" />
          </div>
        </div>
      </div>
    </>
  );
}
