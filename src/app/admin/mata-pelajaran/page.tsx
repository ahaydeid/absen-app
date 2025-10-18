"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ArrowUpDown, Eye, Pencil, Trash2, Plus, Upload, Download } from "lucide-react";

type Mapel = {
  id: number;
  nama: string;
  kode?: string | null;
  // guru bisa dikembalikan sebagai object atau array oleh Supabase, jadi dukung kedua bentuk
  guru?: { nama: string } | { nama: string }[] | null;
  created_at?: string | null;
};

export default function MasterMapelPage() {
  const [mapel, setMapel] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Mapel>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    const fetchMapel = async () => {
      setLoading(true);
      setErrorMsg(null);

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      // Ambil data mapel, termasuk nama guru melalui relasi guru:guru_id (jika ada)
      const { data, error, count } = await supabase
        .from("mapel")
        .select(
          `
            id,
            nama,
            kode,
            created_at,
            guru:guru_id ( nama )
          `,
          { count: "exact" }
        )
        .ilike("nama", `%${search}%`)
        .order(sortColumn, { ascending: sortOrder === "asc" })
        .range(from, to);

      if (error) {
        console.error("Error fetching mapel:", error);
        setErrorMsg(error.message);
      } else {
        setMapel(data || []);
        setTotalRows(count || 0);
      }

      setLoading(false);
    };

    fetchMapel();
  }, [search, sortColumn, sortOrder, page, perPage]);

  const handleSort = (column: keyof Mapel) => {
    if (sortColumn === column) {
      setSortOrder((s) => (s === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const totalPages = Math.ceil(totalRows / perPage) || 1;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Mata Pelajaran</h1>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 active:scale-95 transition">
          <Plus className="w-4 h-4" />
          Tambah Mapel
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 active:scale-95 transition">
          <Upload className="w-4 h-4" />
          Import
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 active:scale-95 transition">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Cari nama mata pelajaran..."
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
          <option value={5}>5 Data</option>
          <option value={10}>10 Data</option>
          <option value={100}>100 Data</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left border-b font-semibold">No</th>
              <th className="px-4 py-3 text-left border-b cursor-pointer select-none" onClick={() => handleSort("nama")}>
                Nama
                <ArrowUpDown className="inline w-4 h-4 ml-1 text-gray-400" />
              </th>
              <th className="px-4 py-3 text-left border-b">Kode</th>
              <th className="px-4 py-3 text-left border-b">Guru</th>
              <th className="px-4 py-3 text-left border-b cursor-pointer select-none" onClick={() => handleSort("created_at")}>
                Dibuat
                <ArrowUpDown className="inline w-4 h-4 ml-1 text-gray-400" />
              </th>
              <th className="px-4 py-3 text-left border-b">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  Memuat data...
                </td>
              </tr>
            ) : mapel.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 italic text-gray-500 border-b">
                  Tidak ada data mata pelajaran
                </td>
              </tr>
            ) : (
              mapel.map((m, idx) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors border-b">
                  <td className="px-4 py-3">{(page - 1) * perPage + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{m.nama}</td>
                  <td className="px-4 py-3">{m.kode || "-"}</td>
                  <td className="px-4 py-3">
                    {Array.isArray(m.guru) ? m.guru[0]?.nama || "-" : m.guru?.nama || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.created_at ? new Date(m.created_at).toLocaleString("id-ID") : "-"}</td>
                  <td className="flex flex-wrap gap-2 px-4 py-2">
                    <button title="Detail" className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button title="Edit" className="p-2 rounded-full bg-yellow-400 text-black hover:bg-yellow-300 transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button title="Hapus" className="p-2 rounded-full bg-red-600 text-white hover:bg-red-500 transition">
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

      <div className="flex justify-between items-center mt-4 text-sm">
        <span className="text-gray-600">
          Menampilkan {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalRows)} dari {totalRows} data
        </span>

        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40">
            ← Sebelumnya
          </button>
          <span className="px-2">
            Hal {page} / {totalPages || 1}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40">
            Berikutnya →
          </button>
        </div>
      </div>
    </div>
  );
}
