"use client";

export default function Topbar({ title }: { title: string }) {
  return (
    <header className="h-14 bg-white top-0 left-0 right-0 border-b border-gray-200 flex sticky items-center justify-between px-4">

      <h2 className="absolute left-1/2 -translate-x-1/2 font-semibold text-gray-700 text-center">
        {title}
      </h2>

      {/* Profil kanan */}
      <div className="ml-auto flex items-center gap-3">
        <h4 className="text-sm font-semibold text-gray-800">Ahadi, S.Kom</h4>
        <div className="w-9 h-9 rounded-full bg-gray-300"></div>
      </div>
    </header>
  );
}
