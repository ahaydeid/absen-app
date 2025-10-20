"use client";

import React, { useEffect, useState } from "react";
import DateDisplay from "@/components/DateDisplay";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

type AbsenRow = {
  id: number;
  tanggal: string; // 'YYYY-MM-DD'
  jadwal_id: number;
};

type JadwalRow = {
  id: number;
  kelas_id: number;
  jam_id: number;
  guru_id?: number | null;
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

const Page: React.FC = () => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createPagesBrowserClient();

  // Helper: format 'YYYY-MM-DD' -> 'D MMMM YYYY' (contoh: 20 Oktober 2025)
  const formatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return "—";
    const parts = dateStr.split("-");
    if (parts.length < 3) return dateStr;
    const yyyy = Number(parts[0]);
    const mm = Number(parts[1]); // 1-12
    const dd = Number(parts[2]);
    if (Number.isNaN(yyyy) || Number.isNaN(mm) || Number.isNaN(dd)) return dateStr;

    const d = new Date(yyyy, mm - 1, dd);
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // ambil session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session) {
          setCards([]);
          setLoading(false);
          return;
        }

        // cari mapping user_accounts -> user_id (referensi ke guru.id)
        const { data: acct, error: acctErr } = await supabase.from("user_accounts").select("user_id, email").eq("auth_user_id", session.user.id).maybeSingle();

        if (acctErr) console.error("Error fetching user_accounts:", acctErr);

        let userAccount = acct ?? null;

        // fallback by email
        if (!userAccount && session.user.email) {
          const { data: byEmail, error: byEmailErr } = await supabase.from("user_accounts").select("user_id, email").eq("email", session.user.email).maybeSingle();
          if (byEmailErr) console.error("Error fetching user_accounts by email:", byEmailErr);
          userAccount = byEmail ?? null;
        }

        const guruId = userAccount?.user_id ?? null;

        // siapkan tanggal hari ini
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        // ambil absen hari ini
        const absenResp = await supabase.from("absen").select("id, tanggal, jadwal_id").eq("tanggal", todayStr).order("id", { ascending: false });

        if (absenResp.error) throw absenResp.error;
        const absenData = (absenResp.data ?? []) as AbsenRow[];

        if (!absenData || absenData.length === 0) {
          setCards([]);
          setLoading(false);
          return;
        }

        // jika tidak ada mapping guru -> kosongkan (guru tidak punya jadwal)
        if (!guruId) {
          setCards([]);
          setLoading(false);
          return;
        }

        // kumpulkan jadwalIds dari absen hari ini
        const jadwalIds = Array.from(new Set(absenData.map((a) => a.jadwal_id)));

        // ambil jadwal yang termasuk di jadwalIds dan milik guru yang login
        const jadwalResp = await supabase.from("jadwal").select("id, kelas_id, jam_id, guru_id").in("id", jadwalIds).eq("guru_id", guruId);

        if (jadwalResp.error) throw jadwalResp.error;
        const jadwalData = (jadwalResp.data ?? []) as JadwalRow[];

        // jika tidak ada jadwal yang cocok (semua absen bukan milik guru ini)
        if (!jadwalData || jadwalData.length === 0) {
          setCards([]);
          setLoading(false);
          return;
        }

        // ambil kelas dan jam berdasarkan referensi dari jadwal yang relevan
        const kelasIds = Array.from(new Set(jadwalData.map((j) => j.kelas_id)));
        const jamIds = Array.from(new Set(jadwalData.map((j) => j.jam_id)));

        const kelasResp = await supabase.from("kelas").select("id, nama").in("id", kelasIds);
        if (kelasResp.error) throw kelasResp.error;
        const kelasData = (kelasResp.data ?? []) as KelasRow[];

        const jamResp = await supabase.from("jam").select("id, mulai, selesai").in("id", jamIds);
        if (jamResp.error) throw jamResp.error;
        const jamData = (jamResp.data ?? []) as JamRow[];

        // buat map lookup
        const jadwalById = new Map<number, JadwalRow>();
        (jadwalData || []).forEach((j) => jadwalById.set(j.id, j));

        const kelasById = new Map<number, string>();
        (kelasData || []).forEach((k) => kelasById.set(k.id, k.nama));

        const jamById = new Map<number, { mulai: string; selesai: string }>();
        (jamData || []).forEach((j) => jamById.set(j.id, { mulai: j.mulai, selesai: j.selesai }));

        // bangun cards hanya untuk absen yang jadwalnya milik guru (ada di jadwalById)
        const built: CardData[] = (absenData || [])
          .map((a) => {
            const jadwal = jadwalById.get(a.jadwal_id);
            if (!jadwal) return null; // skip absen yang bukan milik guru tersebut

            const kelasNama = jadwal ? kelasById.get(jadwal.kelas_id) ?? "—" : "—";
            const jamObj = jadwal ? jamById.get(jadwal.jam_id) : undefined;

            return {
              absenId: a.id,
              kelasNama,
              tanggal: a.tanggal,
              jamMulai: jamObj?.mulai ?? "—",
              jamSelesai: jamObj?.selesai ?? "—",
            } as CardData;
          })
          .filter((x): x is CardData => x !== null);

        if (!mounted) return;
        setCards(built);
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
          if (mounted) setError(err.message);
        } else {
          if (mounted) setError(String(err));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl text-center font-semibold text-gray-800">Log Absen Siswa</h1>
        </header>

        {/* filter UI tetap seperti semula (bisa dihubungkan ke state kalau mau) */}
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
                  className="w-full rounded-md border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-3 flex-1">
              <div className="flex flex-col w-1/2">
                <label htmlFor="dateFrom" className="block text-xs font-medium text-gray-600 mb-1">
                  Dari
                </label>
                <input id="dateFrom" type="date" className="w-full rounded-md border border-gray-200 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="flex flex-col w-1/2">
                <label htmlFor="dateTo" className="block text-xs font-medium text-gray-600 mb-1">
                  Sampai
                </label>
                <input id="dateTo" type="date" className="w-full rounded-md border border-gray-200 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <button type="button" className="w-full md:w-auto text-center font-bold items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-indigo-700">
                Terapkan
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="flex">
            <h2 className="text-lg font-medium text-gray-800 mb-3">Kelas hari ini</h2>
            <p className="text-xs sm:text-sm md:text-lg font-bold text-gray-600 text-right flex-1">
              <DateDisplay />
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-gray-600">Memuat kelas...</p>
          ) : error ? (
            <p className="text-sm text-red-600">Error: {error}</p>
          ) : cards.length === 0 ? (
            <p className="text-sm text-gray-600">Belum ada absensi hari ini.</p>
          ) : (
            <div className="grid gap-1 sm:grid-cols-1 md:grid-cols-2">
              {cards.map((c) => (
                <a key={c.absenId} href={`/log-absen/${c.absenId}`} className="block transform rounded-lg border-gray-100 bg-white px-3 py-1 shadow-sm transition hover:scale-[1.01] hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-extrabold text-gray-600 p-2 rounded-xl">{c.kelasNama}</h3>
                    </div>
                    <div className="text-right">
                      <h6 className="text-gray-600">{formatDate(c.tanggal)}</h6>
                      <p className="text-sm text-gray-700 border-gray-50 border bg-yellow-300 rounded px-1">
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
