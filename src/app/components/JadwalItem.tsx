// components/JadwalItem.tsx (Buat file baru ini)

import Link from "next/link";
import React from "react";

// Definisikan ulang tipe yang diperlukan
type RelOneOrMany<T> = T | T[] | null;
type RawJadwal = {
  id: number;
  hari_id?: number | null;
  jam_id?: number | null;
  kelas_id?: number | null;
  jp?: number | null;
  kelas?: RelOneOrMany<{ nama?: string }>;
  jam?: RelOneOrMany<{ nama?: string; mulai?: string; selesai?: string }>;
  jumlah_jam?: RelOneOrMany<{ nama?: string }>;
};

// Pastikan formatTime tersedia atau definisikan di sini
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const formatTime = (raw?: string | null) => {
  if (!raw) return "";
  const parts = raw.split(":");
  const hh = Number(parts[0] ?? 0);
  const mm = Number(parts[1] ?? 0);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return raw;
  return `${pad(hh)}:${pad(mm)}`;
};

export default function JadwalItem({ j }: { j: RawJadwal }) {
  // Logika ekstraksi data dipindahkan ke sini
  const jamRel = (Array.isArray(j.jam) ? j.jam[0] : j.jam) as { nama?: string; mulai?: string; selesai?: string } | undefined;
  const kelasRel = (Array.isArray(j.kelas) ? j.kelas[0] : j.kelas) as { nama?: string } | undefined;
  const jumlahJamRel = (Array.isArray(j.jumlah_jam) ? j.jumlah_jam[0] : j.jumlah_jam) as { nama?: string } | undefined;

  const jLabel = jamRel?.nama ?? (j.jam_id ? `J-${j.jam_id}` : `J-${j.id}`);
  const mulai = jamRel?.mulai ?? "";
  const selesai = jamRel?.selesai ?? "";
  const timeRange = mulai && selesai ? `${formatTime(mulai)} - ${formatTime(selesai)}` : "";
  const kelasNama = kelasRel?.nama ?? "—";
  const jpLabel = jumlahJamRel?.nama ?? (j.jp ? `${j.jp} JP` : "1 JP");

  return (
    <Link key={j.id} href={j.kelas_id ? `/kelas/${j.kelas_id}` : "#"} className="block" aria-label={`Buka kelas ${kelasNama}`}>
      <div className="flex items-center border shadow rounded-sm bg-gray-100 gap-3 p-1 md:p-1 hover:shadow-md transition">
        <div className="ml-2 w-[56px] h-[56px] sm:w-[72px] sm:h-[72px] md:w-[80px] md:h-[80px] flex-shrink-0 rounded-sm bg-[#00a8d9] text-white flex items-center justify-center">
          <span className="text-lg sm:text-2xl md:text-2xl font-bold p-2 leading-none">{jLabel}</span>
        </div>

        <div className="flex-1 p-2 md:p-3">
          <div className="flex items-center justify-between">
            <div className="text-[16px] sm:text-[18px] md:text-[18px] font-extrabold text-gray-800 leading-tight">{kelasNama}</div>
          </div>

          <div className="mt-2 md:mt-3 flex items-center gap-2">
            {timeRange ? <span className="text-[11px] sm:text-[12px] inline-block bg-[#ffd94a] px-2.5 py-1 border rounded-md font-semibold">{timeRange}</span> : null}
            <span className="text-[11px] sm:text-[12px] inline-block bg-gray-500 text-white px-2 py-1 rounded-md font-semibold">{jpLabel} JP</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
