"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
// Pastikan path ini benar berdasarkan setup Next.js Anda
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

type Database = {
  public: {
    Tables: {
      user_accounts: { Row: { user_id: number | null; auth_user_id: string | null } };
      jadwal: { Row: { id: number; guru_id: number | null; hari_id: number | null; jam_id: number | null; kelas_id: number | null; mapel_id: number | null } };
      kelas: { Row: { nama: string | null } };
      mapel: { Row: { nama: string | null } };
      jam: { Row: { nama: string | null; mulai: string | null; selesai: string | null } };
      absen: { Row: { tanggal: string | null; status_jadwal: boolean | null } };
    };
  };
};

type RawJadwal = {
  id: number;
  kelas?: { nama?: string | null } | null;
  mapel?: { nama?: string | null } | null;
  jam?: { nama?: string | null; mulai?: string | null; selesai?: string | null } | null;
  absen?: { tanggal?: string | null; status_jadwal?: boolean | null }[] | null;
};

type Item = {
  id: number;
  code: string;
  title: string;
  subject: string;
  range: string | null;
  mulaiTime: string | null; // Tambahkan properti untuk pengurutan
  jp: string;
  status: "Selesai" | "Berlangsung" | null;
  isChecked: boolean;
  isOverdue: boolean;
  jadwalId: number;
};

const getTodayHariIdWIB = (): number | null => {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const jsDay = now.getDay();
  // Minggu (0) ke Sabtu (6). Jika Hari ID Anda dimulai dari Senin=1, pastikan logika ini benar.
  // Asumsi: Senin=1, Minggu=7 atau Hari ID 1-7. Jika JS Day 1-6 (Sen-Sab) dan 0 (Min), maka ini mengembalikan 1-6.
  return jsDay === 0 ? null : jsDay;
};
const getTodayISOJakarta = (): string => {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const toMinutes = (time: string | null): number => {
  if (!time) return 0;
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
};
const formatTime = (t: string | null): string => (!t ? "" : t.split(":").slice(0, 2).join(":"));
const computeJP = (mulai?: string | null, selesai?: string | null): string => {
  if (!mulai || !selesai) return "1 JP";
  const durasi = toMinutes(selesai) - toMinutes(mulai);
  return `${Math.max(1, Math.ceil(durasi / 45))} JP`;
};

export default function TodaySection() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Menggunakan useMemo agar objek supabase tidak berubah pada setiap render
  const supabase = useMemo(() => createPagesBrowserClient<Database>(), []);
  const hariId = getTodayHariIdWIB();
  const todayISO = getTodayISOJakarta();

  const mapToItems = useCallback(
    (rows: RawJadwal[]) => {
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const nowMins = now.getHours() * 60 + now.getMinutes();

      const mapped: Item[] = rows.map((j) => {
        const jam = j.jam ?? null;
        const mulai = jam?.mulai ?? "";
        const selesai = jam?.selesai ?? "";
        const selesaiMins = toMinutes(selesai);
        const mulaiMins = toMinutes(mulai);

        // Menentukan status
        const status = nowMins >= selesaiMins ? "Selesai" : nowMins >= mulaiMins && nowMins < selesaiMins ? "Berlangsung" : null;

        const absenToday = (j.absen ?? []).find((a) => a.tanggal === todayISO);
        const isChecked = absenToday?.status_jadwal === true;
        const isOverdue = !isChecked && !!selesai && nowMins >= selesaiMins;

        return {
          id: j.id,
          code: jam?.nama ?? `J-${j.id}`,
          title: j.kelas?.nama ?? "—",
          subject: j.mapel?.nama ?? "-",
          range: mulai && selesai ? `${formatTime(mulai)} - ${formatTime(selesai)}` : null,
          mulaiTime: mulai, // Simpan waktu mulai untuk sorting
          jp: computeJP(mulai, selesai),
          status,
          isChecked,
          isOverdue,
          jadwalId: j.id,
        };
      });

      // --- PERBAIKAN SORTING DI SINI ---
      // Urutkan berdasarkan waktu mulai (mulaiTime) dari yang paling awal
      const sortedItems = mapped.sort((a, b) => {
        const timeA = toMinutes(a.mulaiTime);
        const timeB = toMinutes(b.mulaiTime);
        return timeA - timeB; // Ascending (paling awal di atas)
      });
      // --- AKHIR PERBAIKAN SORTING ---

      // Batasi output ke 6 item setelah disort
      setItems(sortedItems.slice(0, 6));
    },
    [todayISO]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setItems([]);
          return;
        }

        const { data: account } = await supabase.from("user_accounts").select("user_id").eq("auth_user_id", session.user.id).maybeSingle();
        const guruId = account?.user_id;
        if (!guruId || !hariId) {
          setItems([]);
          return;
        }

        // Gunakan LEFT JOIN agar semua jadwal muncul. Hapus order SQL karena sorting dilakukan di klien berdasarkan waktu mulai
        const { data, error: jadwalErr } = await supabase
          .from("jadwal")
          .select(
            `
              id,
              kelas:kelas_id(nama),
              mapel:mapel_id(nama),
              jam:jam_id(nama,mulai,selesai), 
              absen:absen!left(tanggal,status_jadwal)
            `
          )
          .eq("hari_id", hariId)
          .eq("guru_id", guruId);
        // .order("jam_id", { ascending: true }); // Dihapus, sorting dilakukan di mapToItems

        if (jadwalErr) throw jadwalErr;
        mapToItems((data ?? []) as RawJadwal[]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [supabase, hariId, mapToItems]);

  return (
    <section className="mt-5 bg-white mb-3 rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Hari Ini</h2>

      {loading ? (
        <div className="text-sm text-gray-500">Memuat jadwal...</div>
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">Tidak ada jadwal hari ini.</div>
      ) : (
        items.map((item) => (
          <Link key={item.jadwalId} href={`/today/${item.jadwalId}`}>
            <div className="flex items-center mb-2 gap-3 bg-gray-50 border rounded-lg p-3 hover:shadow-sm transition">
              {item.isChecked ? (
                <div className="flex items-center justify-center w-18 h-18 rounded-lg bg-green-600 text-white">
                  <Check className="w-7 h-7" strokeWidth={3} />
                </div>
              ) : item.isOverdue ? (
                <div className="flex flex-col justify-center items-center w-18 h-18 rounded-lg bg-red-600 text-white font-extrabold text-center">
                  <div className="text-sm">Kelas</div>
                  <div className="text-xs">terlewat</div>
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center w-18 h-18 rounded-lg bg-sky-500 text-white font-extrabold">
                  <div className="text-sm">{item.code}</div>
                  <div className="text-xs mt-1">{item.range?.split(" - ")[0] ?? ""}</div>
                </div>
              )}

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-base font-extrabold text-gray-900">{item.title}</div>
                  </div>
                  <ArrowUpRight className="text-gray-400 w-5 h-5" />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {item.range && <span className="text-xs border bg-yellow-300 text-gray-900 font-medium px-2 py-1 rounded-full">{item.range}</span>}
                  <span className="text-xs bg-gray-500 text-white border font-medium px-2 py-1 rounded-full">{item.jp}</span>
                  <div className="italic text-gray-600 text-sm">{item.subject}</div>
                </div>
              </div>
            </div>
          </Link>
        ))
      )}
    </section>
  );
}
