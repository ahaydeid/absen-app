// components/JadwalHariCard.tsx (Buat file baru ini)

import React from "react";
import JadwalItem from "./JadwalItem"; // Impor komponen yang baru dibuat

// Definisikan ulang tipe yang diperlukan
type DayRow = { id: number; nama: string };
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

interface JadwalHariCardProps {
  day: DayRow;
  list: RawJadwal[];
}

export default function JadwalHariCard({ day, list }: JadwalHariCardProps) {
  return (
    <section key={day.id} className="mb-4">
      <div className="rounded-sm border-2 bg-[#009ed6] shadow p-2 py-3 md:p-4 flex flex-row gap-4">
        <div className="w-1/5 flex-shrink-0 flex items-center justify-center">
          <h2 className="text-center text-white text-xl md:text-[16px] font-extrabold">{day.nama}</h2>
        </div>

        <div className="flex-1 min-h-0">
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">{list.length === 0 ? <div className="text-sm text-center text-white/90 py-3">Tidak ada jadwal.</div> : list.map((j) => <JadwalItem key={j.id} j={j} />)}</div>
        </div>
      </div>
    </section>
  );
}
