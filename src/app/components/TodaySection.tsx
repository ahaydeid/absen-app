"use client";

import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

// --- Tipe Data (Disederhanakan) ---

type RelOneOrMany<T> = T | T[] | null;

type RawJadwal = {
  id: number;
  kelas_id?: number | null;
  mapel_id?: number | null;
  guru_id?: number | null;
  hari_id?: number | null;
  jam_id?: number | null;
  kelas?: RelOneOrMany<{ nama?: string }>;
  mapel?: RelOneOrMany<{ nama?: string }>;
  jam?: RelOneOrMany<{ nama?: string; mulai?: string; selesai?: string }>;
};

type Item = {
  id: number;
  code: string;
  time: string;
  title: string;
  subject: string;
  range: string | null;
  jp: string;
  status: "Selesai" | "Berlangsung" | null;
  kelasId?: number | null;
  jadwalId: number;
};

// --- Fungsi Utilitas (Direstrukturisasi dan Disederhanakan) ---

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  const e = err as Record<string, unknown>;
  if (typeof e?.message === "string") return e.message;
  if (typeof e?.error === "string") return e.error;
  return "Terjadi kesalahan yang tidak diketahui.";
}

// Helper untuk mengambil nilai pertama dari relasi (jika array atau null)
const takeFirst = <T,>(v: RelOneOrMany<T>): T | undefined => {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
};

// Fungsi untuk mendapatkan hari_id hari ini (1=Senin... 7=Minggu) di zona waktu WIB
const getTodayHariIdWIB = (): number | null => {
  // Gunakan 'Asia/Jakarta' untuk WIB
  const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const jsDay = nowWIB.getDay(); // 0=Minggu, 1=Senin, ..., 6=Sabtu
  // Mapping: 1=Senin, ..., 6=Sabtu. Jika Minggu (0), kembalikan null atau 7 (tergantung skema DB)
  // Umumnya jadwal hanya ada Senin-Sabtu.
  return jsDay === 0 ? null : jsDay;
};

// Fungsi untuk menghitung JP dari durasi
const computeJP = (jam: { mulai?: string; selesai?: string } | undefined): string => {
  if (!jam?.mulai || !jam?.selesai) return "1 JP";

  const toMinutes = (timeStr: string) => {
    const [hh = 0, mm = 0] = timeStr.split(":").map(Number);
    return hh * 60 + mm;
  };

  const m1 = toMinutes(jam.mulai);
  const m2 = toMinutes(jam.selesai);

  if (m2 > m1) {
    const minutes = m2 - m1;
    // Asumsi 1 JP = 45 menit
    const jp = Math.max(1, Math.ceil(minutes / 45));
    return `${jp} JP`;
  }
  return "1 JP";
};

// Fungsi untuk memformat waktu HH:MM
const formatTime = (raw: string): string => {
  if (!raw) return "";
  const parts = raw.split(":");
  const hh = Number(parts[0] ?? 0);
  const mm = Number(parts[1] ?? 0);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(hh)}:${pad(mm)}`;
};

// --- Komponen Utama ---

export default function TodaySection() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const supabase = createPagesBrowserClient();
  const hariIdToday = getTodayHariIdWIB();

  const mapAndSetItems = useCallback((jadwals: RawJadwal[]) => {
    // Gunakan waktu WIB untuk menentukan status Selesai
    const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));

    const mapped: Item[] = (jadwals ?? []).slice(0, 6).map((j) => {
      const jamRel = takeFirst(j.jam) as { nama?: string; mulai?: string; selesai?: string } | undefined;
      const kelasRel = takeFirst(j.kelas) as { nama?: string } | undefined;

      const mulaiRaw = jamRel?.mulai ?? "";
      const selesaiRaw = jamRel?.selesai ?? "";

      const timeRange = mulaiRaw && selesaiRaw ? `${formatTime(mulaiRaw)} - ${formatTime(selesaiRaw)}` : null;

      const title = kelasRel?.nama ?? "—";
      const subject = takeFirst(j.mapel)?.nama ?? "";
      const jp = computeJP(jamRel);
      const code = jamRel?.nama || (j.jam_id ? `J-${j.jam_id}` : `J-${j.id}`);
      const time = mulaiRaw ? formatTime(mulaiRaw) : "";

      let status: "Selesai" | "Berlangsung" | null = null;
      if (mulaiRaw && selesaiRaw) {
        // Hanya bandingkan waktu (jam, menit) hari ini
        const [hMulai, mMulai] = mulaiRaw.split(":").map(Number);
        const [hSelesai, mSelesai] = selesaiRaw.split(":").map(Number);

        const nowMinutes = nowWIB.getHours() * 60 + nowWIB.getMinutes();
        const mulaiMinutes = hMulai * 60 + mMulai;
        const selesaiMinutes = hSelesai * 60 + mSelesai;

        if (nowMinutes >= selesaiMinutes) {
          status = "Selesai";
        } else if (nowMinutes >= mulaiMinutes && nowMinutes < selesaiMinutes) {
          status = "Berlangsung"; // Tambahkan status berlangsung jika diperlukan
        }
      }

      return {
        id: j.id,
        code,
        time,
        title,
        subject,
        range: timeRange,
        jp,
        status,
        kelasId: j.kelas_id ?? null,
        jadwalId: j.id,
      };
    });

    setItems(mapped);
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      setErrorDetail(null);

      try {
        // 1. Ambil session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted || !session) {
          setItems([]);
          return;
        }

        // 2. Ambil user_id (guru_id) dari user_accounts
        const { data: acct, error: acctErr } = await supabase.from("user_accounts").select("user_id").eq("auth_user_id", session.user.id).maybeSingle();

        if (acctErr) console.warn("Error fetching user_accounts:", acctErr);

        const guruId = acct?.user_id ?? null;

        if (!guruId || hariIdToday === null) {
          // Tidak ada mapping ke guru, atau hari ini Minggu (asumsi tidak ada jadwal)
          setItems([]);
          return;
        }

        // 3. Ambil Jadwal HARI INI (sesuai hariIdToday WIB) dan guru_id
        const selectStr = `id, kelas_id, mapel_id, guru_id, hari_id, jam_id, ` + `kelas:kelas_id(nama), mapel:mapel_id(nama), jam:jam_id(nama,mulai,selesai)`;

        const { data, error: jadwalErr } = await supabase
          .from("jadwal")
          .select(selectStr)
          .eq("hari_id", hariIdToday) // FILTER UTAMA: Hanya Hari Ini (WIB)
          .eq("guru_id", guruId) // FILTER KEDUA: Hanya Guru yang Login
          .order("jam_id", { ascending: true }); // Limit 6 tidak diperlukan jika kita hanya ingin yang hari ini

        if (jadwalErr) {
          // Jika terjadi error pada query relasi, tampilkan error
          console.error("Supabase jadwal query failed:", jadwalErr);
          throw jadwalErr;
        }

        mapAndSetItems((data ?? []) as unknown as RawJadwal[]);
      } catch (err: unknown) {
        console.error("Error in TodaySection.load:", err);
        setError(extractErrorMessage(err));
        setErrorDetail(typeof err === "object" ? JSON.stringify(err, Object.getOwnPropertyNames(err), 2) : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [supabase, mapAndSetItems, hariIdToday]); // Tambahkan dependensi mapAndSetItems

  return (
    <section className="mt-5 bg-white rounded-lg mb-5 p-4 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Hari ini</h2>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-gray-500">Memuat jadwal...</div>
        ) : error ? (
          <>
            <div className="text-sm text-red-500">Error: {error}</div>
            {errorDetail && <pre className="mt-2 p-2 bg-gray-100 text-xs text-gray-700 rounded">{errorDetail}</pre>}
          </>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500">Tidak ada jadwal hari ini.</div>
        ) : (
          items.map((item) => (
            <Link key={item.jadwalId} href={`/today/${item.jadwalId}`} aria-label={`Buka ${item.title}`} className="block">
              <div className="flex items-center gap-3 bg-gray-50 border rounded-lg p-3 relative hover:shadow-sm transition group">
                {item.status === "Selesai" ? (
                  <div className="flex items-center justify-center w-18 h-18 rounded-lg bg-green-600 text-white">
                    <Check className="w-7 h-7" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="flex flex-col justify-center items-center w-18 h-18 rounded-xl bg-sky-500 text-white font-extrabold">
                    <div className="text-sm">{item.code}</div>
                    <div className="text-xs mt-1">{item.time}</div>
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-base font-extrabold text-gray-900">{item.title}</div>
                      <div className="italic text-gray-600 text-sm">{item.subject}</div>
                    </div>

                    <span className="text-gray-400">
                      <ArrowUpRight className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {item.range && <span className="text-xs border bg-yellow-300 text-gray-900 font-medium px-2 py-1 rounded-full">{item.range}</span>}
                    <span className="text-xs bg-gray-500 text-white border font-medium px-2 py-1 rounded-full">{item.jp}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
