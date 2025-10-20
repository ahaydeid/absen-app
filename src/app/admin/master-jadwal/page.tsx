"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, PenBox, Trash2 } from "lucide-react";
import ModalsRegisJadwal from "../components/ModalsRegisJadwal";
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

export default function MasterJadwalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [jadwals, setJadwals] = useState<JadwalRelasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const { data, error: fetchError } = await supabase.from("jadwal").select(selectQuery).order("hari_id", { ascending: true }).order("jam_id", { ascending: true });

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

  const filteredJadwal = jadwals.filter((item) => {
    const term = searchTerm.toLowerCase();
    const kelas = item.kelas?.nama?.toLowerCase() ?? "";
    const guru = item.guru?.nama?.toLowerCase() ?? "";
    const mapel = item.mapel?.nama?.toLowerCase() ?? "";
    return kelas.includes(term) || guru.includes(term) || mapel.includes(term);
  });

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
                placeholder="Cari Mata Pelajaran..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition duration-200">
              <Plus className="w-5 h-5" /> Buat Jadwal Baru
            </button>
          </div>
        </header>
        <ModalsRegisJadwal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <section className="bg-white p-4 rounded shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Daftar Jadwal ({loading ? "..." : jadwals.length})</h2>
          {loading && <div className="text-center py-8 text-gray-600">Memuat data jadwal...</div>}
          {error && <div className="text-center py-8 text-red-600">Error: {error}</div>}
          {!loading && jadwals.length === 0 && !error && <div className="text-center py-8 text-gray-500">Belum ada data jadwal yang terdaftar.</div>}
          {!loading && !error && (
            <div className="overflow-x-auto min-h-full">
              <table className="min-w-max w-full divide-y divide-gray-200 table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Nama Hari</th>
                    <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Nama Kelas</th>
                    <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Nama Guru</th>
                    <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Nama Mata Pelajaran</th>
                    <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Jam Mulai</th>
                    <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Jam Selesai</th>
                    <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Jumlah Jam</th>
                    <th className="px-6 py-3 text-left text-base font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJadwal.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition duration-100">
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{item.hari?.nama ?? "—"}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{item.kelas?.nama ?? "—"}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{item.guru?.nama ?? "—"}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{item.mapel?.nama ?? "—"}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{formatTime(item.jam?.mulai)}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-800">{formatTime(item.jam?.selesai)}</td>
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
                  {filteredJadwal.length === 0 && jadwals.length > 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                        Tidak ada data jadwal ditemukan yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
