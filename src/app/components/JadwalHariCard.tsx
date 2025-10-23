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

// Fungsi utilitas untuk mendapatkan nama hari saat ini dalam Bahasa Indonesia
const getTodayName = (): string => {
  // Tanggal.getDay() mengembalikan 0 (Minggu) hingga 6 (Sabtu)
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayIndex = new Date().getDay();
  return days[todayIndex]!;
};

export default function JadwalHariCard({ day, list }: JadwalHariCardProps) {
  const todayName = getTodayName();
  const isToday = day.nama === todayName;

  // Tentukan kelas CSS untuk container utama (section)
  const containerClass = isToday
    ? // JIKA HARI INI: Tetap biru (warna lama)
      "bg-[#009ed6] border-sky-600"
    : // JIKA BUKAN HARI INI: Putih dengan border
      "bg-white text-gray-800 border-gray-300";

  // Tentukan kelas CSS untuk header hari (nama hari)
  const headerClass = isToday ? "text-white" : "text-gray-800"; // Ubah warna teks header menjadi hitam jika latar belakang putih

  // Tentukan kelas CSS untuk teks 'Tidak ada jadwal'
  const emptyListClass = isToday ? "text-white/90" : "text-gray-500"; // Ubah warna teks menjadi abu-abu jika latar belakang putih

  return (
    <section key={day.id} className="mb-4">
      <div className={`rounded-xl border-2 shadow p-2 py-3 md:p-4 flex flex-row gap-4 transition duration-300 ${containerClass}`}>
        {/* Kolom Nama Hari */}
        <div className="w-1/5 flex-shrink-0 flex items-center justify-center">
          <h2 className={`text-center text-xl md:text-[16px] font-extrabold ${headerClass}`}>{day.nama}</h2>
        </div>

        {/* Kolom Daftar Jadwal */}
        <div className="flex-1 min-h-0">
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {list.length === 0 ? (
              <div className={`text-sm text-center py-3 ${emptyListClass}`}>Tidak ada jadwal.</div>
            ) : (
              // Gunakan list.map seperti sebelumnya
              list.map((j) => <JadwalItem key={j.id} j={j} />)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
