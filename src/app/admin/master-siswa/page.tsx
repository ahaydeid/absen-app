"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ArrowUpDown } from "lucide-react";
import { Eye, Pencil, Trash2, Plus, Upload, Download } from "lucide-react";

type Siswa = {
  id: number;
  nis: string;
  nama: string;
  kelas?: { nama: string } | { nama: string }[] | null;
  user_id?: string;
  created_at?: string;
};

export default function AdminDashboardPage() {
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 🔍 Search, Sort, Pagination States
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Siswa>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    const fetchSiswa = async () => {
      setLoading(true);
      setErrorMsg(null);

      // Hitung offset untuk pagination
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      // Query Supabase dengan pencarian, sort & pagination
      let query = supabase
        .from("siswa")
        .select(
          `
          id,
          nis,
          nama,
          user_id,
          created_at,
          kelas:siswa_kelas_id_fkey ( nama )
        `,
          { count: "exact" }
        )
        .order(sortColumn, { ascending: sortOrder === "asc" })
        .range(from, to);

      if (search.trim() !== "") {
        query = query.ilike("nama", `%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching siswa:", error);
        setErrorMsg(error.message);
      } else {
        setSiswa(data || []);
        setTotalRows(count || 0);
      }

      setLoading(false);
    };

    fetchSiswa();
  }, [search, sortColumn, sortOrder, page, perPage]);

  const handleSort = (column: keyof Siswa) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const totalPages = Math.ceil(totalRows / perPage);

  // ======================= UI ========================
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6"> Data Siswa</h1>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white cursor-pointer rounded-lg hover:bg-sky-700 active:scale-95 transition">
          <Plus className="w-4 h-4" />
          Tambah Siswa
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300  cursor-pointer rounded-lg bg-green-600 hover:bg-emerald-500 text-white active:scale-95 transition">
          <Upload className="w-4 h-4" />
          Import
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 cursor-pointer rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 transition">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Cari nama siswa..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />

        <select
          value={perPage}
          onChange={(e) => {
            setPage(1);
            setPerPage(Number(e.target.value));
          }}
          className="border border-gray-300 rounded-md px-2 py-2 text-sm"
        >
          <option value={5}>5 Datas</option>
          <option value={10}>10 Datas</option>
          <option value={100}>100 Datas</option>
        </select>
      </div>

      {/*Tabel */}
      <div className="overflow-x-auto rounded border border-gray-200 shadow-sm bg-white">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left border-b font-semibold">No</th>
              <th className="px-4 py-3 text-left border-b cursor-pointer select-none" onClick={() => handleSort("nama")}>
                Nama
                <ArrowUpDown className="inline w-4 h-4 ml-1 text-gray-400" />
              </th>
              <th className="px-4 py-3 text-left border-b cursor-pointer select-none" onClick={() => handleSort("nis")}>
                NIS
                <ArrowUpDown className="inline w-4 h-4 ml-1 text-gray-400" />
              </th>
              <th className="px-4 py-3 text-left border-b">Kelas</th>
              <th className="px-4 py-3 text-left border-b">User ID</th>
              <th className="px-4 py-3 text-left border-b cursor-pointer select-none" onClick={() => handleSort("created_at")}>
                Dibuat
                <ArrowUpDown className="inline w-4 h-4 ml-1 text-gray-400" />
              </th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  Memuat data...
                </td>
              </tr>
            ) : siswa.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 italic text-gray-500 border-b">
                  Tidak ada data siswa
                </td>
              </tr>
            ) : (
              siswa.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors border-b">
                  <td className="px-4 py-3">{(page - 1) * perPage + index + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{item.nama}</td>
                  <td className="px-4 py-3">{item.nis || "-"}</td>
                  <td className="px-4 py-3">{Array.isArray(item.kelas) ? item.kelas[0]?.nama || "Tidak ada kelas" : item.kelas?.nama || "Tidak ada kelas"}</td>
                  <td className="px-4 py-3 text-gray-500">{item.user_id ? item.user_id.slice(0, 8) + "..." : "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.created_at ? new Date(item.created_at).toLocaleString("id-ID") : "-"}</td>
                  <td className="flex gap-2 py-2 px-2">
                    <button title="Detail" className="p-2 rounded-full bg-blue-600 cursor-pointer text-white hover:bg-blue-100 transition">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button title="Edit" className="p-2 rounded-full bg-yellow-400 cursor-pointer text-black hover:bg-yellow-100 transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button title="Hapus" className="p-2 rounded-full bg-red-600 cursor-pointer text-white hover:bg-red-100 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {errorMsg && <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded">Error: {errorMsg}</div>}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <span className="text-gray-600">
          Menampilkan {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalRows)} dari {totalRows} data
        </span>

        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border cursor-pointer rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40">
            ← Sebelumnya
          </button>
          <span className="px-2">
            Hal {page} / {totalPages || 1}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border cursor-pointer rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40">
            Berikutnya →
          </button>
        </div>
      </div>
    </div>
  );
}
