"use client";

export default function Topbar({ title }: { title: string }) {
  return (
    // sticky di luar, z untuk memastikan selalu di atas
    <header className="sticky top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
      <div className="h-14 max-w-7xl mx-auto px-4 flex items-center justify-between relative">
        {/* kiri (kosong atau bisa taruh back button) */}
        <div className="flex items-center gap-3">{/* placeholder supaya center title tidak overlap */}</div>

        {/* Judul di tengah: absolute relatif ke ancestor (header wrapper punya position non-static karena sticky) */}
        <h2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-gray-700 text-center truncate max-w-[60%]">{title}</h2>

        {/* Profil kanan */}
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-semibold text-gray-800 whitespace-nowrap">Ahadi, S.Kom</h4>
          <div className="w-9 h-9 rounded-full bg-gray-300" />
        </div>
      </div>
    </header>
  );
}
