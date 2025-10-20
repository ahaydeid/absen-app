"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type DayRow = {
  id: number;
  nama: string;
};

type RelOneOrMany<T> = T | T[] | null;

type RawJadwal = {
  id: number;
  hari_id?: number | null;
  jam_id?: number | null;
  kelas_id?: number | null;
  jp?: number | null;
  kelas?: RelOneOrMany<{ nama?: string }>;
  jam?: RelOneOrMany<{ nama?: string; mulai?: string; selesai?: string }>;
  jumlah_jam?: RelOneOrMany<{ nama?: string }>;
};

export default function Page(): React.ReactElement {
  const [days, setDays] = useState<DayRow[]>([]);
  const [jadwals, setJadwals] = useState<RawJadwal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatTime = (raw?: string | null) => {
    if (!raw) return "";
    const parts = raw.split(":");
    const hh = Number(parts[0] ?? 0);
    const mm = Number(parts[1] ?? 0);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return raw;
    return `${pad(hh)}:${pad(mm)}`;
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) ambil hari dari DB (exclude Minggu) — asumsi id 1..6 = Senin..Sabtu
        const daysResp = await supabase.from("hari").select("id, nama").gte("id", 1).lte("id", 6).order("id", { ascending: true });

        if (daysResp.error) throw daysResp.error;

        const daysData = (daysResp.data ?? []) as DayRow[];

        if (!mounted) return;
        setDays(daysData);

        if (daysData.length === 0) {
          setJadwals([]);
          setLoading(false);
          return;
        }

        // 2) ambil semua jadwal untuk hari-hari yang ada (relation-select)
        const hariIds = daysData.map((d) => d.id);
        const selectStr = "id, hari_id, jam_id, kelas_id, jp, " + "kelas:kelas_id(nama), jam:jam_id(nama,mulai,selesai), jumlah_jam:jp(nama)";

        const jadwalResp = await supabase.from("jadwal").select(selectStr).in("hari_id", hariIds).order("hari_id", { ascending: true }).order("jam_id", { ascending: true });

        if (jadwalResp.error) throw jadwalResp.error;

        const jadwalData = (jadwalResp.data ?? []) as unknown as RawJadwal[];

        if (!mounted) return;
        setJadwals(jadwalData);
      } catch (err: unknown) {
        console.error("Load schedule error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  // group jadwal by hari_id for rendering
  const jadwalMap = React.useMemo(() => {
    const m = new Map<number, RawJadwal[]>();
    jadwals.forEach((j) => {
      const hid = j.hari_id ?? -1;
      if (!m.has(hid)) m.set(hid, []);
      m.get(hid)!.push(j);
    });
    return m;
  }, [jadwals]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-4 pb-28">
      <div className="mx-auto w-full px-4 max-w-xl md:max-w-2xl lg:max-w-3xl">
        <h1 className="text-center text-2xl md:text-[20px] font-extrabold mb-4">Jadwal</h1>

        {loading ? (
          <div className="text-center text-gray-500">Memuat jadwal...</div>
        ) : error ? (
          <div className="text-center text-red-600">Error: {error}</div>
        ) : (
          days.map((day) => {
            const list = jadwalMap.get(day.id) ?? [];
            return (
              <section key={day.id} className="mb-4">
                <div className="rounded-xl border bg-[#009ed6] p-3 md:p-4">
                  <h2 className="text-center text-white text-base md:text-[16px] font-bold mb-2 md:mb-3">{day.nama}</h2>

                  <div className="space-y-2">
                    {list.length === 0 ? (
                      <div className="text-sm text-center text-white/90 py-3">Tidak ada jadwal.</div>
                    ) : (
                      list.map((j) => {
                        const jamRel = (Array.isArray(j.jam) ? j.jam[0] : j.jam) as { nama?: string; mulai?: string; selesai?: string } | undefined;
                        const kelasRel = (Array.isArray(j.kelas) ? j.kelas[0] : j.kelas) as { nama?: string } | undefined;
                        const jumlahJamRel = (Array.isArray(j.jumlah_jam) ? j.jumlah_jam[0] : j.jumlah_jam) as { nama?: string } | undefined;

                        const jLabel = jamRel?.nama ?? (j.jam_id ? `J-${j.jam_id}` : `J-${j.id}`);
                        const mulai = jamRel?.mulai ?? "";
                        const selesai = jamRel?.selesai ?? "";
                        const timeRange = mulai && selesai ? `${formatTime(mulai)} - ${formatTime(selesai)}` : "";
                        const kelasNama = kelasRel?.nama ?? "—";
                        const jpLabel = jumlahJamRel?.nama ?? (j.jp ? `${j.jp} JP` : "1 JP");

                        return (
                          <Link key={j.id} href={j.kelas_id ? `/kelas/${j.kelas_id}` : "#"} className="block" aria-label={`Buka kelas ${kelasNama}`}>
                            <div className="flex items-center rounded-lg bg-white gap-3 p-1 md:p-1 hover:shadow-md transition">
                              <div className="ml-2 w-[56px] h-[56px] sm:w-[72px] sm:h-[72px] md:w-[80px] md:h-[80px] flex-shrink-0 rounded-lg bg-[#00a8d9] text-white flex items-center justify-center">
                                <span className="text-lg sm:text-2xl md:text-2xl font-bold p-2 leading-none">{jLabel}</span>
                              </div>

                              <div className="flex-1 p-2 md:p-3">
                                <div className="flex items-center justify-between">
                                  <div className="text-[16px] sm:text-[18px] md:text-[18px] font-extrabold text-gray-800 leading-tight">{kelasNama}</div>
                                </div>

                                <div className="mt-2 md:mt-3 flex items-center gap-2">
                                  {timeRange ? <span className="text-[11px] sm:text-[12px] inline-block bg-[#ffd94a] px-2.5 py-1 rounded-md font-semibold">{timeRange}</span> : null}

                                  <span className="text-[11px] sm:text-[12px] inline-block bg-[#d1d5db] px-2 py-1 rounded-md font-semibold">{jpLabel} JP</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>
            );
          })
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
