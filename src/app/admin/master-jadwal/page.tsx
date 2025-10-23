"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, PenBox, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import ModalsRegisJadwal from "../components/ModalsRegisJadwal";
import ModalBuatJadwalKelas from "../components/ModalBuatJadwalKelas";

import { supabase } from "@/lib/supabaseClient";

interface JadwalRelasi {
  id: number;
  hari_id: number;
  kelas_id: number;
  guru_id: number;
  mapel_id: number;
  jam_id: number;
  jp: number;
  semester_id: number;
  hari: { nama: string } | null;
  kelas: { nama: string } | null;
  guru: { nama: string } | null;
  mapel: { nama: string } | null;
  jam: { mulai: string; selesai: string } | null;
  jumlah_jam: { nama: string } | null;
  semester: { nama: string } | null;
}

// Tipe Union untuk menampung semua kemungkinan nilai yang akan dicari.
type SearchableValue = string | number | null | undefined | { nama: string | null | undefined };

// Opsi jumlah data yang ingin ditampilkan
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Definisikan urutan hari yang benar (Senin-Sabtu) untuk sorting di client
const HARI_ORDER: { [key: string]: number } = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
};

export default function MasterJadwalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [jadwals, setJadwals] = useState<JadwalRelasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  // DEFAULT pageSize DIUBAH KE 20
  const [pageSize, setPageSize] = useState(20);

  const fetchJadwal = async () => {
    setLoading(true);
    setError(null);
    try {
      const selectQuery = `
        id, hari_id, kelas_id, guru_id, mapel_id, jam_id, jp, semester_id,
        hari:hari_id(nama),
        kelas:kelas_id(nama),
        guru:guru_id(nama),
        mapel:mapel_id(nama),
        jam:jam_id(mulai, selesai),
        jumlah_jam:jp(nama),
        semester:semester_id(nama)
      `;

      // NOTE: Data diambil semua dari awal, pagination dilakukan di sisi klien
      const { data, error: fetchError } = await supabase.from("jadwal").select(selectQuery);

      if (fetchError) throw fetchError;

      if (data && Array.isArray(data)) {
        setJadwals(data as unknown as JadwalRelasi[]);
      } else {
        setJadwals([]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error fetching jadwal:", err);
      setError("Gagal memuat data jadwal: " + message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchJadwal();
  }, []);

  useEffect(() => {
    const onCreated = () => void fetchJadwal();
    window.addEventListener("jadwal:created", onCreated);
    return () => window.removeEventListener("jadwal:created", onCreated);
  }, []);

  // Reset halaman ke-1 setiap kali searchTerm atau pageSize berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Modifikasi Logika Filter dan Sort
  const sortedAndFilteredJadwal = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    // 1. Filtering
    const filtered = jadwals.filter((item) => {
      if (!term) return true;

      // Fungsi helper untuk mendapatkan nilai string dari kolom, menangani null/undefined/number
      const getSearchableValue = (value: SearchableValue): string => {
        if (value === null || value === undefined) return "";

        // Memeriksa apakah nilai adalah objek dan memiliki properti 'nama'
        if (typeof value === "object" && value !== null && "nama" in value) {
          const nama = (value as { nama: string | null | undefined }).nama;
          if (nama !== null && nama !== undefined) {
            return String(nama).toLowerCase();
          }
        }

        // Menangani string atau number (seperti item.jp)
        return String(value).toLowerCase();
      };

      // Dapatkan nilai pencarian untuk semua kolom
      const searchableFields = [
        getSearchableValue(item.hari?.nama),
        getSearchableValue(item.kelas?.nama),
        getSearchableValue(item.guru?.nama),
        getSearchableValue(item.mapel?.nama),
        getSearchableValue(item.jam?.mulai),
        getSearchableValue(item.jam?.selesai),
        getSearchableValue(item.semester?.nama),
        // Penanganan khusus untuk Jumlah Jam: cek 'nama' lalu fallback ke 'jp' (number)
        getSearchableValue(item.jumlah_jam?.nama ?? item.jp),
      ];

      return searchableFields.some((field) => field.includes(term));
    });

    // 2. Sorting
    const sorted = [...filtered];

    sorted.sort((a, b) => {
      // 1. Sort Primary: Hari (Senin-Sabtu)
      const aHariOrder = HARI_ORDER[a.hari?.nama?.toLowerCase() ?? ""] ?? Infinity;
      const bHariOrder = HARI_ORDER[b.hari?.nama?.toLowerCase() ?? ""] ?? Infinity;

      if (aHariOrder !== bHariOrder) {
        return aHariOrder - bHariOrder;
      }

      // 2. Sort Secondary: Jam Mulai (Menggunakan string waktu untuk perbandingan)
      // Gunakan '00:00:00' sebagai fallback untuk memastikan perbandingan yang benar
      const aMulai = a.jam?.mulai ?? "00:00:00";
      const bMulai = b.jam?.mulai ?? "00:00:00";

      const timeComparison = aMulai.localeCompare(bMulai);
      if (timeComparison !== 0) {
        return timeComparison;
      }

      // 3. Sort Tertiary: Nama Kelas (A-Z)
      const aKelas = a.kelas?.nama ?? "";
      const bKelas = b.kelas?.nama ?? "";
      return aKelas.localeCompare(bKelas);
    });

    return sorted;
  }, [jadwals, searchTerm]); // Dependensi: jadwals dan searchTerm

  // Logika Pagination di sisi klien
  const totalItems = sortedAndFilteredJadwal.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const currentJadwals = sortedAndFilteredJadwal.slice(startIndex, endIndex);

  const formatTime = (timeString: string | undefined | null): string => {
    if (!timeString) return "—";
    const parts = timeString.split(":");
    return `${parts[0]}:${parts[1]}`;
  };

  return (
    <div className="min-h-screen min-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto py-6">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800 mb-6">Manajemen Master Jadwal</h1>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-1/3">
              <input
                type="text"
                // Mengubah placeholder untuk mencerminkan pencarian menyeluruh
                placeholder="Cari di semua kolom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition duration-150"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition duration-200">
                <Plus className="w-5 h-5" /> Sisipkan Jadwal
              </button>

              <button onClick={() => setIsBatchModalOpen(true)} className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-yellow-400 italic hover:bg-yellow-300 transition duration-200">
                Buat Jadwal Kelas
              </button>
            </div>
          </div>
        </header>
        <ModalsRegisJadwal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <ModalBuatJadwalKelas isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} />

        <section className="bg-white p-4 rounded shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Daftar Jadwal</h2>
          {loading && <div className="text-center py-8 text-gray-600">Memuat data jadwal...</div>}
          {error && <div className="text-center py-8 text-red-600">Error: {error}</div>}
          {!loading && jadwals.length === 0 && !error && <div className="text-center py-8 text-gray-500">Belum ada data jadwal yang terdaftar.</div>}

          {!loading && !error && (
            <>
              {/* Pagination dan Page Size Controls */}
              <div className="flex justify-between items-center mb-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span>Tampilkan:</span>
                  <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="p-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500">
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabel Data */}
              <div className="overflow-x-auto min-h-full">
                <table className="min-w-max w-full divide-y divide-gray-200 table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">No</th>
                      <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Nama Hari</th>
                      <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Jam Mulai</th>
                      <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Jam Selesai</th>
                      <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Nama Kelas</th>
                      <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Nama Guru</th>
                      <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Nama Mata Pelajaran</th>
                      <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Semester</th>
                      <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Jumlah Jam</th>
                      <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentJadwals.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition duration-100">
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{startIndex + index + 1}</td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{item.hari?.nama ?? "—"}</td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{formatTime(item.jam?.mulai)}</td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{formatTime(item.jam?.selesai)}</td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{item.kelas?.nama ?? "—"}</td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{item.guru?.nama ?? "—"}</td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{item.mapel?.nama ?? "—"}</td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{item.semester?.nama ?? "—"}</td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 font-bold">{item.jumlah_jam?.nama ?? item.jp ?? "—"}</td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 font-bold">
                          <div className="flex items-center gap-2">
                            <button className="flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded">
                              <PenBox className="w-4 h-4" />
                            </button>
                            <button className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentJadwals.length === 0 && sortedAndFilteredJadwal.length > 0 && (
                      <tr>
                        <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                          Tidak ada data jadwal ditemukan di halaman ini.
                        </td>
                      </tr>
                    )}
                    {sortedAndFilteredJadwal.length === 0 && jadwals.length > 0 && (
                      <tr>
                        <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                          Tidak ada data jadwal ditemukan yang cocok dengan pencarian Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Navigasi Pagination yang sudah diubah */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-700">
                    {Math.min(endIndex, totalItems)} dari {totalItems} data
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      aria-label="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {/* Tampilan "1/3, dst" */}
                    <span className="px-3 py-1 text-gray-600 rounded-md font-semibold">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      aria-label="Halaman Selanjutnya"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
