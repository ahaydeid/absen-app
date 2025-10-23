"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

// --- Tipe Data ---

type AbsenRow = {
  id: number;
  tanggal: string; // 'YYYY-MM-DD'
  jadwal_id: number;
};

type JadwalRow = {
  id: number;
  kelas_id: number;
  jam_id: number;
};

type KelasRow = {
  id: number;
  nama: string;
};

type JamRow = {
  id: number;
  mulai: string;
  selesai: string;
};

type CardData = {
  absenId: number;
  kelasNama: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
};

// --- Konstanta Pagination ---
const ITEMS_PER_PAGE = 10;

// --- Komponen Utama ---

const Page: React.FC = () => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Pagination
  const [page, setPage] = useState(0); // 0-indexed page
  const [totalCount, setTotalCount] = useState(0); // Total data yang cocok dengan filter

  // State untuk Filter Tanggal
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [filterTrigger, setFilterTrigger] = useState(0);

  const supabase = createPagesBrowserClient();

  // Helper: format 'YYYY-MM-DD' -> 'D MMMM YYYY'
  const formatDate = useCallback((dateStr: string | undefined | null): string => {
    if (!dateStr) return "—";
    try {
      const [yyyy, mm, dd] = dateStr.split("-").map(Number);
      if (Number.isNaN(yyyy) || Number.isNaN(mm) || Number.isNaN(dd)) return dateStr;

      const d = new Date(yyyy, mm - 1, dd);
      return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch {
      return dateStr;
    }
  }, []);

  const handleApplyFilter = () => {
    // Reset ke halaman pertama saat filter baru diterapkan
    setPage(0); 
    setFilterTrigger((prev) => prev + 1);
  };
  
  const handleNextPage = () => {
    if ((page + 1) * ITEMS_PER_PAGE < totalCount) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  useEffect(() => {
    // FIX 1: Gunakan flag lokal dan fungsi cleanup untuk mounted status
    let mounted = true;

    const loadAbsen = async () => {
      setLoading(true);
      setError(null);

      // Hitung range data untuk Query Supabase
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1; 

      try {
        // 1. Ambil Session & Guru ID
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted || !session) {
          setCards([]);
          return;
        }

        const { data: acct } = await supabase.from("user_accounts").select("user_id").eq("auth_user_id", session.user.id).maybeSingle();

        const guruId = acct?.user_id ?? null;
        if (!guruId) {
          setCards([]);
          return;
        }

        // 2. Query Absen dengan Pagination dan Count Total
        let absenQuery = supabase
          .from("absen")
          .select("id, tanggal, jadwal_id", { count: 'exact' }) // Tambahkan count: 'exact'
          .order("tanggal", { ascending: false });

        // Terapkan Filter Tanggal
        if (dateFrom) {
          absenQuery = absenQuery.gte("tanggal", dateFrom);
        }
        if (dateTo) {
          absenQuery = absenQuery.lte("tanggal", dateTo);
        }
        
        // Terapkan Pagination
        absenQuery = absenQuery.range(from, to);

        const { data: absenData, error: absenErr, count: total } = await absenQuery;
        
        if (absenErr) throw absenErr;
        
        if (mounted) {
            setTotalCount(total ?? 0);
        }

        if (!absenData || absenData.length === 0) {
          setCards([]);
          return;
        }

        const absenRows = absenData as AbsenRow[];
        const jadwalIds = Array.from(new Set(absenRows.map((a) => a.jadwal_id)));

        // 3. Ambil Jadwal yang Relevan (milik Guru ini)
        const { data: jadwalData, error: jadwalErr } = await supabase
          .from("jadwal")
          .select("id, kelas_id, jam_id")
          .in("id", jadwalIds)
          .eq("guru_id", guruId);

        if (jadwalErr) throw jadwalErr;

        const jadwalRows = (jadwalData ?? []) as JadwalRow[];
        const jadwalById = new Map<number, JadwalRow>();
        jadwalRows.forEach((j) => jadwalById.set(j.id, j));

        // Filter absen yang jadwalnya BUKAN milik guru ini
        const relevantAbsen = absenRows.filter((a) => jadwalById.has(a.jadwal_id));

        if (relevantAbsen.length === 0) {
          setCards([]);
          return;
        }

        // 4. Ambil Kelas & Jam
        const kelasIds = Array.from(new Set(jadwalRows.map((j) => j.kelas_id)));
        const jamIds = Array.from(new Set(jadwalRows.map((j) => j.jam_id)));

        const [kelasResp, jamResp] = await Promise.all([supabase.from("kelas").select("id, nama").in("id", kelasIds), supabase.from("jam").select("id, mulai, selesai").in("id", jamIds)]);

        if (kelasResp.error) throw kelasResp.error;
        if (jamResp.error) throw jamResp.error;

        // 5. Buat Map Lookup
        const kelasById = new Map<number, string>();
        (kelasResp.data as KelasRow[]).forEach((k) => kelasById.set(k.id, k.nama));

        const jamById = new Map<number, { mulai: string; selesai: string }>();
        (jamResp.data as JamRow[]).forEach((j) => jamById.set(j.id, { mulai: j.mulai, selesai: j.selesai }));

        // 6. Bangun Cards
        const builtCards: CardData[] = relevantAbsen.map((a) => {
          const jadwal = jadwalById.get(a.jadwal_id)!;
          const kelasNama = kelasById.get(jadwal.kelas_id) ?? "—";
          const jamObj = jamById.get(jadwal.jam_id);

          return {
            absenId: a.id,
            kelasNama,
            tanggal: a.tanggal,
            jamMulai: jamObj?.mulai ?? "—",
            jamSelesai: jamObj?.selesai ?? "—",
          };
        });

        if (!mounted) return;
        setCards(builtCards);
      } catch (err: unknown) {
        console.error("Error loading absen data:", err);
        if (err instanceof Error) {
          if (mounted) setError(err.message);
        } else {
          if (mounted) setError(String(err));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadAbsen();

    // Fungsi cleanup untuk mengatasi warning/error 'mounted'
    return () => {
      mounted = false;
    };
    
  }, [supabase, dateFrom, dateTo, filterTrigger, page]);

  // FIX 2 & 3: Akses perhitungan pagination di JSX dengan mendefinisikannya di luar useEffect
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;
  const currentPageDisplay = totalCount > 0 ? page + 1 : 0;
  
  // Hitung `from` dan `to` untuk display (menggantikan error Cannot find name 'from'/'to')
  const displayFrom = totalCount > 0 ? (page * ITEMS_PER_PAGE) + 1 : 0;
  const displayTo = Math.min(displayFrom + ITEMS_PER_PAGE - 1, totalCount);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl text-center font-semibold text-gray-800">Log Absen Siswa</h1>
        </header>

        {/* --- Filter Section (HANYA Tanggal) --- */}
        <section className="bg-white rounded sticky shadow-sm p-4 mb-6">
          <div className="flex flex-col gap-4 sticky md:flex-row md:items-end md:gap-6">
            <div className="flex gap-3 flex-grow">
              <div className="flex flex-col w-1/2">
                <label htmlFor="dateFrom" className="block text-xs font-medium text-gray-600 mb-1">
                  Dari Tanggal
                </label>
                <input
                  id="dateFrom"
                  type="date"
                  value={dateFrom || ""}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="flex flex-col w-1/2">
                <label htmlFor="dateTo" className="block text-xs font-medium text-gray-600 mb-1">
                  Sampai Tanggal
                </label>
                <input
                  id="dateTo"
                  type="date"
                  value={dateTo || ""}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <button 
                type="button" 
                onClick={handleApplyFilter} 
                className="w-full md:w-auto text-center font-bold items-center gap-2 rounded-md bg-sky-600 px-3 py-2.5 text-sm text-white shadow-sm hover:bg-sky-700 transition duration-150 h-full"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </section>

        {/* --- Daftar Kelas Absen --- */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-gray-800">
                Log Harian ({totalCount} total data)
            </h2>
            <div className="text-sm text-gray-600">
                Halaman {currentPageDisplay} dari {totalPages}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-600">Memuat log absensi...</p>
          ) : error ? (
            <p className="text-sm text-red-600">Error: {error}</p>
          ) : cards.length === 0 ? (
            <p className="text-sm text-gray-600">Tidak ada log absensi ditemukan {dateFrom || dateTo ? "untuk periode ini." : "."}</p>
          ) : (
            <>
                <div className="grid gap-1 sm:grid-cols-1 md:grid-cols-2">
                  {cards.map((c) => (
                    <a key={c.absenId} href={`/log-absen/${c.absenId}`} className="block transform rounded-sm border border-gray-200 bg-white px-4 py-3 transition hover:scale-[1.01] hover:shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl mt-2 font-extrabold text-gray-800">{c.kelasNama}</h3>
                        </div>
                        <div className="text-right">
                          <h6 className="text-sm text-gray-600 mb-1">{formatDate(c.tanggal)}</h6>
                          <p className="text-xs text-gray-700 border border-gray-300 bg-yellow-300 font-semibold rounded-full px-2 py-0.5 inline-block">
                            {c.jamMulai.substring(0, 5)} - {c.jamSelesai.substring(0, 5)}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* --- Pagination Controls --- */}
                <div className="mt-6 flex justify-between items-center">
                    <button
                        onClick={handlePrevPage}
                        disabled={isFirstPage || loading}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition duration-150 ${
                            isFirstPage || loading
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-sky-600 text-white hover:bg-sky-700"
                        }`}
                    >
                        &larr;
                    </button>
                    <div className="text-sm text-gray-600">
                        {displayFrom} - {displayTo} dari {totalCount}
                    </div>
                    <button
                        onClick={handleNextPage}
                        disabled={isLastPage || loading}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition duration-150 ${
                            isLastPage || loading
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-sky-600 text-white hover:bg-sky-700"
                        }`}
                    >
                        &rarr;
                    </button>
                </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default Page;