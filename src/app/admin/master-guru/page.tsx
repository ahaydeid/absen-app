"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ArrowUpDown, Eye, Pencil, Trash2, Plus, Upload, Download } from "lucide-react";

type Guru = {
  id: number;
  nip: string;
  nama: string;
  email: string;
  mapel?: { nama: string } | null;
  created_at?: string;
};

type GuruRowFromDB = {
  id: number;
  nip: string | null;
  nama: string;
  email: string | null;
  created_at: string | null;
  // Supabase sering mengembalikan relasi sebagai array
  mapel: { nama: string }[] | { nama: string } | null;
};

export default function MasterGuruPage() {
  const [guru, setGuru] = useState<Guru[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<keyof Guru>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [totalRows, setTotalRows] = useState<number>(0);

  useEffect(() => {
    const fetchGuru = async (): Promise<void> => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        const { data, error, count } = await supabase
          .from("guru")
          .select(
            `
            id,
            nip,
            nama,
            email,
            created_at,
            mapel:mapel_id ( nama )
          `,
            { count: "exact" }
          )
          .ilike("nama", `%${search ?? ""}%`)
          .order(String(sortColumn), { ascending: sortOrder === "asc" })
          .range(from, to)
          // .returns may or may not be necessary depending supabase client version;
          // kept for clearer typing but can be removed if your client errors on it.
          .returns<GuruRowFromDB[]>();

        if (error) {
          setErrorMsg(error.message);
          setGuru([]);
          setTotalRows(0);
        } else {
          const normalized: Guru[] = (data ?? []).map((row) => ({
            id: Number(row.id),
            nip: row.nip ?? "",
            nama: row.nama,
            email: row.email ?? "",
            created_at: row.created_at ?? undefined,
            mapel: (Array.isArray(row.mapel) ? row.mapel[0] : row.mapel) ?? null,
          }));

          setGuru(normalized);
          setTotalRows(count ?? 0);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg(String(err));
        }
      } finally {
        setLoading(false);
      }
    };

    // Panggil di luar definisi fungsi (sebelumnya kamu menaruh fetchGuru() di dalamnya)
    fetchGuru();
  }, [search, sortColumn, sortOrder, page, perPage]);

  const handleSort = (column: keyof Guru) => {
    if (sortColumn === column) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Data Guru</h1>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 active:scale-95 transition">
          <Plus className="w-4 h-4" />
          Tambah Guru
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
          placeholder="Cari nama guru..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />

        <select
          value={perPage}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
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
              <th className="px-4 py-3 text-left border-b">NIP</th>
              <th className="px-4 py-3 text-left border-b">Mata Pelajaran</th>
              <th className="px-4 py-3 text-left border-b">Email</th>
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
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  Memuat data...
                </td>
              </tr>
            ) : guru.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 italic text-gray-500 border-b">
                  Tidak ada data guru
                </td>
              </tr>
            ) : (
              guru.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors border-b">
                  <td className="px-4 py-3">{(page - 1) * perPage + index + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{item.nama}</td>
                  <td className="px-4 py-3">{item.nip || "-"}</td>
                  <td className="px-4 py-3">{item.mapel?.nama || "-"}</td>
                  <td className="px-4 py-3">{item.email || "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.created_at ? new Date(item.created_at).toLocaleString("id-ID") : "-"}</td>
                  <td className="flex flex-wrap gap-2 py-2">
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
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 cursor-pointer py-1 border rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40">
            ← Sebelumnya
          </button>
          <span className="px-2">
            Hal {page} / {totalPages || 1}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 cursor-pointer py-1 border rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40">
            Berikutnya →
          </button>
        </div>
      </div>
    </div>
  );
}
