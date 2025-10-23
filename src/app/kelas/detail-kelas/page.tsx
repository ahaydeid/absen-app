"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// --- Tipe Data ---
type SiswaRow = { id: number; nama: string };
type AbsenRow = { tanggal: string; statuses: Record<string, number[]> | null };
type StatusKey = "hadir" | "sakit" | "izin" | "alfa";

const STATUS_PRIORITY: Record<StatusKey, number> = {
  alfa: 4,
  sakit: 3,
  izin: 2,
  hadir: 1,
};

const formatTanggalPendek = (raw?: string | null) => {
  if (!raw) return "-";
  const parts = raw.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return raw;
};

// PENTING: Komponen utama diganti namanya dan dikemas dalam Suspense di bawah.
function DetailKelasContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("id");
  const kelasId = rawId ? Number(rawId) : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kelasNama, setKelasNama] = useState("—");
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([]);
  const [absenHistory, setAbsenHistory] = useState<AbsenRow[]>([]);

  useEffect(() => {
    if (!kelasId || Number.isNaN(kelasId)) {
      setError("ID kelas tidak ditemukan atau tidak valid di URL.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setKelasNama("—");
      setSiswaList([]);
      setAbsenHistory([]);

      try {
        const { data: kData, error: kError } = await supabase.from("kelas").select("nama").eq("id", kelasId).maybeSingle();
        if (kError) throw kError;
        setKelasNama((kData as { nama: string } | null)?.nama ?? `Kelas ID ${kelasId}`);

        const { data: sData, error: sError } = await supabase.from("siswa").select("id, nama").eq("kelas_id", kelasId).order("nama", { ascending: true });
        if (sError) throw sError;
        setSiswaList(sData || []);

        // 1. Cari semua jadwal_id untuk kelas ini
        const { data: jData, error: jError } = await supabase.from("jadwal").select("id").eq("kelas_id", kelasId);
        if (jError) throw jError;
        const jadwalIds = (jData || []).map((j) => j.id);

        // 2. Ambil data absen berdasarkan jadwal_id
        const { data: aData, error: aError } = await supabase.from("absen").select("tanggal, statuses").in("jadwal_id", jadwalIds).order("tanggal", { ascending: false });
        if (aError) throw aError;

        const history = (aData || []).map((row) => ({
          tanggal: row.tanggal,
          // Pastikan statuses di-cast dengan benar
          statuses: row.statuses as Record<string, number[]> | null,
        })) as AbsenRow[];

        setAbsenHistory(history);
      } catch (err) {
        console.error("Error loading detail:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [kelasId]);

  const getStatusBadge = (siswaId: number, absenRow: AbsenRow) => {
    if (!absenRow.statuses) return <div className="text-gray-300 text-xs">—</div>;

    let currentStatusKey: string | null = null;
    let maxPriority = -1;

    // Iterasi melalui setiap kelompok status (hadir, sakit, izin, alfa)
    for (const [statusKey, studentIds] of Object.entries(absenRow.statuses)) {
      if (studentIds.includes(siswaId)) {
        // Cari status dengan prioritas tertinggi (A > S > I > H)
        const priority = STATUS_PRIORITY[statusKey as StatusKey] || 0;
        if (priority > maxPriority) {
          maxPriority = priority;
          currentStatusKey = statusKey;
        }
      }
    }

    if (!currentStatusKey) return <div className="text-gray-300 text-xs">—</div>;

    let badgeClasses: string;
    let badgeContent: React.ReactNode;

    switch (currentStatusKey) {
      case "hadir":
        badgeClasses = "bg-green-600 text-white";
        badgeContent = <Check className="w-4 h-4" />;
        break;
      case "sakit":
        badgeClasses = "bg-yellow-400 text-gray-900";
        badgeContent = "S";
        break;
      case "izin":
        badgeClasses = "bg-sky-400 text-white";
        badgeContent = "I";
        break;
      case "alfa":
        badgeClasses = "bg-red-500 text-white";
        badgeContent = "A";
        break;
      default:
        badgeClasses = "bg-gray-400 text-white";
        badgeContent = currentStatusKey.charAt(0).toUpperCase();
    }

    return <div className={`w-6 h-6 flex items-center justify-center rounded-sm text-xs font-bold ${badgeClasses}`}>{badgeContent}</div>;
  };

  const NAMA_COLUMN_OFFSET = "50px";

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="max-w-full mx-auto bg-white rounded-xl shadow p-6">
        <header className="mb-6">
          <h1 className="text-lg font-bold text-sky-600">RIWAYAT KEHADIRAN KELAS</h1>
          <h2 className="text-3xl font-extrabold text-gray-800 border-b pb-2">{kelasNama}</h2>
          <p className="text-sm text-gray-500 mt-2">
            Menampilkan {absenHistory.length} data absen terakhir. {siswaList.length} siswa.
          </p>
        </header>

        {loading ? (
          <p className="text-gray-600 text-center py-8">Memuat riwayat kehadiran...</p>
        ) : error ? (
          <p className="text-red-600 text-center py-8">Error: {error}</p>
        ) : siswaList.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Tidak ada siswa di kelas ini.</p>
        ) : absenHistory.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Belum ada data absen yang dicatat untuk kelas ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Kolom No dan Nama Siswa dibuat sticky */}
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 w-[50px] shadow-sm">NO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[50px] bg-gray-50 z-20 w-[150px] border-r border-gray-200 shadow-sm">Nama Siswa</th>

                  {/* Header Tanggal */}
                  {absenHistory.map((absen, index) => (
                    <th key={index} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px] border-l border-gray-100" title={absen.tanggal}>
                      {formatTanggalPendek(absen.tanggal)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {siswaList.map((siswa, index) => (
                  <tr key={siswa.id} className="hover:bg-gray-50">
                    {/* Data No Urut (Sticky Left) */}
                    <td className="px-3 py-2 text-sm text-gray-600 text-center sticky left-0 bg-white z-10 font-medium border-r border-gray-200">{index + 1}</td>

                    {/* Data Nama Siswa (Sticky Left) */}
                    <td className="px-4 py-2 text-sm text-gray-800 font-semibold sticky left-[50px] bg-white z-10 border-r border-gray-200" style={{ left: NAMA_COLUMN_OFFSET }}>
                      {siswa.nama}
                    </td>

                    {/* Data Status Absen Harian */}
                    {absenHistory.map((absen, idx) => (
                      <td key={idx} className="px-2 py-2 text-center border-l border-gray-100">
                        <div className="flex justify-center">{getStatusBadge(siswa.id, absen)}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Komponen default diekspor dengan Suspense Boundary
export default function DetailKelasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 p-6">
          <p className="text-gray-600 text-center py-8">Memuat halaman...</p>
        </div>
      }
    >
      <DetailKelasContent />
    </Suspense>
  );
}
