"use client";

import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type RelOneOrMany<T> = T | T[] | null;

type RawJadwal = {
  id: number;
  kelas_id?: number | null;
  mapel_id?: number | null;
  guru_id?: number | null;
  hari_id?: number | null;
  jam_id?: number | null;
  semester_id?: number | null;
  kelas?: RelOneOrMany<{ nama?: string }>;
  mapel?: RelOneOrMany<{ nama?: string }>;
  // NOTE: don't request durasi here (column doesn't exist)
  jam?: RelOneOrMany<{ nama?: string; mulai?: string; selesai?: string }>;
};

type Item = {
  id: number;
  kode: string;
  code: string;
  time: string;
  title: string;
  subject: string;
  range: string | null;
  jp: string;
  status: string | null;
  kelasId?: number | null;
  jadwalId: number;
};

function extractErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message;
  const e = err as Record<string, unknown>;
  if (typeof e.message === "string") return e.message;
  if (typeof e.error === "string") return e.error;
  try {
    return JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
  } catch {
    return String(err);
  }
}

export default function TodaySection() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setErrorDetail(null);

      try {
        const jsDay = new Date().getDay();
        const hariId = jsDay === 0 ? null : jsDay; // 1..6 => Mon..Sat

        // removed durasi from jam select
        const selectStr = `id, kelas_id, mapel_id, guru_id, hari_id, jam_id, semester_id, ` + `kelas:kelas_id(nama), mapel:mapel_id(nama), jam:jam_id(nama,mulai,selesai)`;

        let resp;
        if (hariId !== null) {
          resp = await supabase.from("jadwal").select(selectStr).eq("hari_id", hariId).order("jam_id", { ascending: true }).limit(6);
        } else {
          resp = await supabase.from("jadwal").select(selectStr).order("jam_id", { ascending: true }).limit(6);
        }

        if (resp.error) {
          console.warn("Supabase relation-select failed, falling back. error:", resp.error);
          const fallback = await supabase.from("jadwal").select("id, kelas_id, mapel_id, guru_id, hari_id, jam_id, semester_id").order("jam_id", { ascending: true }).limit(6);

          if (fallback.error) throw fallback.error;
          mapAndSetItems((fallback.data ?? []) as unknown as RawJadwal[]);
          return;
        }

        const data = (resp.data ?? []) as unknown as RawJadwal[];

        if (!data || data.length === 0) {
          const fallback = await supabase.from("jadwal").select(selectStr).order("id", { ascending: true }).limit(6);

          if (fallback.error) throw fallback.error;
          mapAndSetItems((fallback.data ?? []) as unknown as RawJadwal[]);
          return;
        }

        mapAndSetItems(data);
      } catch (err: unknown) {
        console.error("Error in TodaySection.load:", err);
        const msg = extractErrorMessage(err);
        setError(msg);
        try {
          setErrorDetail(typeof err === "object" ? JSON.stringify(err, Object.getOwnPropertyNames(err), 2) : String(err));
        } catch {
          setErrorDetail(String(err));
        }
      } finally {
        setLoading(false);
      }
    };

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const formatTime = (raw: string) => {
      if (!raw) return "";
      const parts = raw.split(":");
      const hh = Number(parts[0] ?? 0);
      const mm = Number(parts[1] ?? 0);
      return `${pad(hh)}:${pad(mm)}`;
    };
    const toMinutes = (timeStr: string) => {
      const parts = timeStr.split(":").map((p) => Number(p));
      const hh = parts[0] ?? 0;
      const mm = parts[1] ?? 0;
      return hh * 60 + mm;
    };
    const combineDateAndTime = (date: Date, timeStr: string) => {
      const d = new Date(date);
      const [hh = "0", mm = "0"] = timeStr.split(":");
      d.setHours(Number(hh), Number(mm), 0, 0);
      return d;
    };

    const takeFirst = <T,>(v: RelOneOrMany<T>): T | undefined => {
      if (!v) return undefined;
      return Array.isArray(v) ? v[0] : v;
    };

    // compute JP only from mulai/selesai (since durasi col not present)
    const computeJP = (jam: { mulai?: string; selesai?: string } | undefined) => {
      if (!jam) return "1 JP";
      if (jam.mulai && jam.selesai) {
        const m1 = toMinutes(jam.mulai);
        const m2 = toMinutes(jam.selesai);
        if (!isNaN(m1) && !isNaN(m2) && m2 > m1) {
          const minutes = m2 - m1;
          const jp = Math.max(1, Math.ceil(minutes / 45));
          return `${jp} JP`;
        }
      }
      return "1 JP";
    };

    const mapAndSetItems = (jadwals: RawJadwal[]) => {
      const now = new Date();
      const mapped: Item[] = jadwals.slice(0, 6).map((j) => {
        const jamRel = takeFirst(j.jam) as { nama?: string; mulai?: string; selesai?: string } | undefined;
        const kelasRel = takeFirst(j.kelas) as { nama?: string } | undefined;

        if (!kelasRel?.nama) {
          console.warn(`jadwal.id=${j.id} missing kelas.nama (kelas_id=${j.kelas_id})`);
        }

        const mulaiRaw = jamRel?.mulai ?? "";
        const selesaiRaw = jamRel?.selesai ?? "";
        const jamNama = jamRel?.nama ?? "";

        const code = jamNama || (j.jam_id ? `J-${j.jam_id}` : `J-${j.id}`);
        const time = mulaiRaw ? formatTime(mulaiRaw) : "";
        const range = mulaiRaw && selesaiRaw ? `${formatTime(mulaiRaw)} - ${formatTime(selesaiRaw)}` : null;
        const title = kelasRel?.nama ?? "—";
        const subject = "Algoritma Pemrograman";
        const jp = computeJP({ mulai: mulaiRaw, selesai: selesaiRaw });

        let status: string | null = null;
        if (mulaiRaw) {
          const mulaiDate = combineDateAndTime(now, mulaiRaw);
          if (mulaiDate < now) status = "Selesai";
        }

        return {
          id: j.id,
          kode: code,
          code,
          time,
          title,
          subject,
          range,
          jp,
          status,
          kelasId: j.kelas_id ?? null,
          jadwalId: j.id,
        };
      });

      setItems(mapped);
    };

    load();
  }, []);

  return (
    <section className="mt-5 bg-white rounded-xl p-4 shadow-sm">
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
            <div key={item.jadwalId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 relative">
              {item.status === "Selesai" ? (
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-green-500 text-white">
                  <Check className="w-7 h-7" strokeWidth={3} />
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center w-16 h-16 rounded-xl bg-sky-500 text-white font-bold">
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

                  <Link href={`/today/${item.jadwalId}`}>
                    <ArrowUpRight className="w-5 h-5 text-gray-400" />
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {item.range && <span className="text-xs bg-yellow-300 text-gray-900 font-medium px-2 py-1 rounded-full">{item.range}</span>}
                  {item.status === "Selesai" && <span className="text-xs bg-green-500 text-white font-semibold px-2 py-1 rounded-full">Selesai</span>}
                  <span className="text-xs bg-gray-400 text-white font-medium px-2 py-1 rounded-full">{item.jp}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
