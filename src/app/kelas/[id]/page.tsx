"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
// import { Check } from "lucide-react"; 
import { supabase } from "@/lib/supabaseClient";

// --- Tipe Data ---

type SiswaRow = {
  id: number;
  nama: string;
};

type SiswaAccumulatedStatus = SiswaRow & {
  counts: {
    hadir: number;
    sakit: number;
    izin: number;
    alfa: number;
  };
};

type StatusKey = "hadir" | "sakit" | "izin" | "alfa";

// --- Komponen Pembantu ---

// Komponen untuk menampilkan Badge hitungan
const CountBadge = ({ count, status }: { count: number; status: StatusKey }) => {
  if (count === 0) return null;

  const colors: Record<StatusKey, string> = {
    hadir: "bg-green-600",
    sakit: "bg-yellow-400 text-gray-900",
    izin: "bg-sky-400",
    alfa: "bg-red-500",
  };

  // Icon Hadir khusus
  // const content = status === "hadir" ? <Check className="w-3 h-3 me-1" /> : null;

  return (
    <span className={`flex items-center justify-center min-w-8 px-2 py-1 rounded text-xs font-bold text-white ${colors[status]}`} title={`Total ${status}: ${count}`}>
      {/* {content} */}
      {count}
    </span>
  );
};

// --- Komponen Utama ---

export default function KelasDetailPage() {
  const params = useParams();
  const idParam = params?.id;
  const kelasId = typeof idParam === "string" ? Number(idParam) : NaN;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [kelasNama, setKelasNama] = useState<string>("—");
  const [siswaData, setSiswaData] = useState<SiswaAccumulatedStatus[]>([]);

  useEffect(() => {
    if (!kelasId || Number.isNaN(kelasId)) {
      setError("ID kelas tidak valid");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setKelasNama("—");
      setSiswaData([]);

      try {
        // 1. Ambil Nama Kelas
        const { data: kData, error: kError } = await supabase.from("kelas").select("nama").eq("id", kelasId).maybeSingle();
        if (kError) throw kError;
        setKelasNama((kData as { nama: string } | null)?.nama ?? `Kelas ID ${kelasId}`);

        // 2. Ambil semua Jadwal ID yang terkait dengan Kelas ini
        const { data: jData, error: jError } = await supabase.from("jadwal").select("id").eq("kelas_id", kelasId);
        if (jError) throw jError;
        const jadwalIds = (jData || []).map((j) => j.id);

        // 3. Ambil semua Siswa di Kelas ini
        const { data: sData, error: sError } = await supabase.from("siswa").select("id, nama").eq("kelas_id", kelasId).order("nama", { ascending: true });
        if (sError) throw sError;
        const siswaList: SiswaRow[] = sData || [];

        if (siswaList.length === 0) {
          setLoading(false);
          return;
        }

        // 4. Ambil SEMUA data Absen untuk Jadwal ID yang terkait
        const { data: aData, error: aError } = await supabase.from("absen").select("statuses").in("jadwal_id", jadwalIds);
        if (aError) throw aError;
        const allAbsenRows = aData || [];

        // 5. Akumulasi status kehadiran per Siswa
        const statusAccumulator = new Map<number, { hadir: number; sakit: number; izin: number; alfa: number }>();
        siswaList.forEach((s) => statusAccumulator.set(s.id, { hadir: 0, sakit: 0, izin: 0, alfa: 0 }));

        for (const row of allAbsenRows) {
          let statusesObj: Record<string, number[]> = {};

          if (row.statuses && typeof row.statuses === "object") {
            statusesObj = row.statuses as Record<string, number[]>;
          }
          // (Anda bisa tambahkan logic parsing string JSON di sini jika Supabase menyimpan JSON sebagai string)

          (Object.keys(statusesObj) as StatusKey[]).forEach((status) => {
            if (["hadir", "sakit", "izin", "alfa"].includes(status)) {
              const siswaIds: number[] = statusesObj[status] || [];
              siswaIds.forEach((siswaId) => {
                if (statusAccumulator.has(siswaId)) {
                  statusAccumulator.get(siswaId)![status] += 1;
                }
              });
            }
          });
        }

        // 6. Finalisasi Data Siswa
        const finalData: SiswaAccumulatedStatus[] = siswaList.map((siswa) => ({
          ...siswa,
          counts: statusAccumulator.get(siswa.id)!,
        }));

        setSiswaData(finalData);
      } catch (err: unknown) {
        console.error("Error loading detail:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [kelasId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        <header className="mb-6">
          <h1 className="text-sm ms-3 mb-1 font-bold text-gray-500">Rekap Kehadiran Siswa</h1>

          {/* Pengaturan header: Nama Kelas (kiri) vs Tombol Detail (kanan) */}
          <div className="flex items-center justify-between ms-3">
            <div className="text-3xl font-bold text-gray-700 mt-1">{kelasNama}</div>

            {/* Tombol Navigasi ke Halaman Detail (misalnya untuk detail administrasi) */}
            {kelasId && !Number.isNaN(kelasId) ? (
              <Link href={`/kelas/detail-kelas?id=${kelasId}`} className="px-3 py-1 bg-sky-500 text-white text-sm font-semibold rounded-lg shadow hover:bg-sky-600 transition-colors duration-150">
                Lihat detail
              </Link>
            ) : (
              <span className="px-3 py-1 bg-gray-400 text-white text-sm font-semibold rounded-lg shadow cursor-not-allowed">Lihat detail</span>
            )}
          </div>
        </header>

        <div className="border-t border-gray-100 pt-3">
          {loading ? (
            <p className="py-4 text-gray-600 px-5">Memuat data akumulasi kehadiran...</p>
          ) : error ? (
            <p className="py-4 text-red-600 px-5">Error: {error}</p>
          ) : siswaData.length === 0 ? (
            <p className="py-4 text-gray-600 px-5">Tidak ada siswa atau data absen ditemukan untuk kelas ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">NO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-5/12">Nama Siswa</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12" title="Hadir">
                      H
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12" title="Sakit">
                      S
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12" title="Izin">
                      I
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12" title="Alfa">
                      A
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {siswaData.map((siswa, index) => (
                    <tr key={siswa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}.</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">{siswa.nama}</td>

                      {/* Kolom Hadir */}
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <CountBadge count={siswa.counts.hadir} status="hadir" />
                        </div>
                      </td>

                      {/* Kolom Sakit */}
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <CountBadge count={siswa.counts.sakit} status="sakit" />
                        </div>
                      </td>

                      {/* Kolom Izin */}
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <CountBadge count={siswa.counts.izin} status="izin" />
                        </div>
                      </td>

                      {/* Kolom Alfa */}
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <CountBadge count={siswa.counts.alfa} status="alfa" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
