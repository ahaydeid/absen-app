"use client";

import React, { useEffect, useState, useCallback } from "react";
import DateDisplay from "@/components/DateDisplay";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

// --- Tipe Data ---

// Disederhanakan untuk kemudahan referensi
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

// --- Komponen Utama ---

const Page: React.FC = () => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State baru untuk menangani filter tanggal
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  // State untuk trigger ulang load data saat filter diterapkan
  const [filterTrigger, setFilterTrigger] = useState(0);

  const supabase = createPagesBrowserClient();

  // Helper: format 'YYYY-MM-DD' -> 'D MMMM YYYY' (memoized function)
  const formatDate = useCallback((dateStr: string | undefined | null): string => {
    if (!dateStr) return "—";
    try {
      const [yyyy, mm, dd] = dateStr.split("-").map(Number);
      if (Number.isNaN(yyyy) || Number.isNaN(mm) || Number.isNaN(dd)) return dateStr;

      // Catatan: Month di Date constructor adalah 0-indexed
      const d = new Date(yyyy, mm - 1, dd);
      // Gunakan Intl.DateTimeFormat untuk format lokal yang benar
      return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch {
      return dateStr;
    }
  }, []);

  const handleApplyFilter = () => {
    // Trigger useEffect untuk memuat data baru
    setFilterTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    let mounted = true;

    const loadAbsen = async () => {
      setLoading(true);
      setError(null);

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

        // 2. Query Absen (FILTER PENGGANTI)
        let absenQuery = supabase.from("absen").select("id, tanggal, jadwal_id").order("tanggal", { ascending: false }); // Urutkan berdasarkan tanggal terbaru

        // Terapkan Filter "Dari" dan "Sampai" jika ada
        if (dateFrom) {
          absenQuery = absenQuery.gte("tanggal", dateFrom);
        }
        if (dateTo) {
          absenQuery = absenQuery.lte("tanggal", dateTo);
        }

        // JIKA TIDAK ADA FILTER, Query AKAN MENGAMBIL SEMUA DATA (sampai batas default Supabase)
        // Kita tidak lagi memfilter berdasarkan tanggal hari ini

        const { data: absenData, error: absenErr } = await absenQuery;
        if (absenErr) throw absenErr;

        if (!absenData || absenData.length === 0) {
          setCards([]);
          return;
        }

        const absenRows = absenData as AbsenRow[];
        const jadwalIds = Array.from(new Set(absenRows.map((a) => a.jadwal_id)));

        // 3. Ambil Jadwal yang Relevan (milik Guru ini)
        const { data: jadwalData, error: jadwalErr } = await supabase
          .from("jadwal")
          .select("id, kelas_id, jam_id") // guru_id tidak perlu dipilih lagi karena sudah dipakai filter
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
          const jadwal = jadwalById.get(a.jadwal_id)!; // Dijamin ada karena sudah difilter
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

    return () => {
      mounted = false;
    };
    // Tambahkan dateFrom, dateTo, dan filterTrigger sebagai dependency
  }, [supabase, dateFrom, dateTo, filterTrigger]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl text-center font-semibold text-gray-800">Log Absen Siswa</h1>
        </header>

        {/* --- Filter Section --- */}
        <section className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
            <div className="flex-1">
              <label htmlFor="search" className="block text-xs font-medium text-gray-600 mb-1">
                Cari kelas
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17.65 17.65A7.5 7.5 0 1110.5 3a7.5 7.5 0 017.15 14.65z" />
                </svg>
                <input
                  id="search"
                  type="text"
                  placeholder="Cari by nama kelas, guru, atau jam"
                  className="w-full rounded-md border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
            <div className="flex gap-3 flex-1">
              <div className="flex flex-col w-1/2">
                <label htmlFor="dateFrom" className="block text-xs font-medium text-gray-600 mb-1">
                  Dari
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
                  Sampai
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
              <button type="button" onClick={handleApplyFilter} className="w-full md:w-auto text-center font-bold items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-sky-700 transition duration-150">
                Terapkan
              </button>
            </div>
          </div>
        </section>

        {/* --- Daftar Kelas Absen --- */}
        <section>
          <div className="flex items-center">
            <h2 className="text-lg font-medium text-gray-800 mb-3">{dateFrom || dateTo ? "Hasil Filter Absen" : "Semua Log Absen"}</h2>
            <p className="text-xs sm:text-sm md:text-lg font-bold text-gray-600 text-right flex-1">
              <DateDisplay />
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-gray-600">Memuat kelas...</p>
          ) : error ? (
            <p className="text-sm text-red-600">Error: {error}</p>
          ) : cards.length === 0 ? (
            <p className="text-sm text-gray-600">Tidak ada log absensi ditemukan {dateFrom || dateTo ? "untuk periode ini." : "."}</p>
          ) : (
            <div className="grid gap-1 sm:grid-cols-1 md:grid-cols-2">
              {cards.map((c) => (
                <a key={c.absenId} href={`/log-absen/${c.absenId}`} className="block transform rounded border border-gray-200 bg-white px-4 py-3 transition hover:scale-[1.01] hover:shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl mt-2 font-extrabold text-gray-800">{c.kelasNama}</h3>
                    </div>
                    <div className="text-right">
                      <h6 className="text-sm text-gray-600 mb-1">{formatDate(c.tanggal)}</h6>
                      <p className="text-xs text-gray-700 border border-gray-300 bg-yellow-300 font-semibold rounded-full px-2 py-0.5 inline-block">
                        {c.jamMulai} - {c.jamSelesai}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Page;
