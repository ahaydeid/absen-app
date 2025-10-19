"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import DateDisplay from "@/components/DateDisplay";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useSearchParams } from "next/navigation";

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
  jam?: RelOneOrMany<{ nama?: string; mulai?: string; selesai?: string }>;
};

export default function TodayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const id = rawId ? parseInt(rawId, 10) : undefined;

  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string | null>(null);
  const [jadwal, setJadwal] = useState<RawJadwal | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      setJadwal(null);

      const jsDay = new Date().getDay(); // 0..6
      const hariCandidates = jsDay === 0 ? [0, 7] : [jsDay];

      const selectStr = `id, kelas_id, mapel_id, guru_id, hari_id, jam_id, semester_id, ` + `kelas:kelas_id(nama), mapel:mapel_id(nama), jam:jam_id(nama,mulai,selesai)`;

      try {
        // 1) try by jadwal.id
        const byId = await supabase.from("jadwal").select(selectStr).eq("id", id).limit(1);
        if (byId.error) throw byId.error;
        const dataById = (byId.data ?? []) as unknown as RawJadwal[];
        if (dataById.length > 0) {
          setJadwal(dataById[0]);
          setLoading(false);
          return;
        }

        // 2) try by kelas_id for today's hari
        const byKelasToday = await supabase.from("jadwal").select(selectStr).in("hari_id", hariCandidates).eq("kelas_id", id).order("jam_id", { ascending: true }).limit(1);

        if (byKelasToday.error) throw byKelasToday.error;
        const dataByKelas = (byKelasToday.data ?? []) as unknown as RawJadwal[];
        if (dataByKelas.length > 0) {
          setJadwal(dataByKelas[0]);
          setLoading(false);
          return;
        }

        setError("Tidak menemukan jadwal untuk parameter yang diberikan.");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
        setError(String(message));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // helpers
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatTime = (raw?: string) => {
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
  const computeJP = (mulai?: string, selesai?: string) => {
    if (!mulai || !selesai) return "1 JP";
    const m1 = toMinutes(mulai);
    const m2 = toMinutes(selesai);
    if (isNaN(m1) || isNaN(m2) || m2 <= m1) return "1 JP";
    const minutes = m2 - m1;
    const jp = Math.max(1, Math.ceil(minutes / 45));
    return `${jp} JP`;
  };

  const card = (() => {
    if (!jadwal) return null;
    const jam = !jadwal.jam ? undefined : Array.isArray(jadwal.jam) ? jadwal.jam[0] : jadwal.jam;
    const kelas = !jadwal.kelas ? undefined : Array.isArray(jadwal.kelas) ? jadwal.kelas[0] : jadwal.kelas;
    const mulai = jam?.mulai ?? "";
    const selesai = jam?.selesai ?? "";
    const time = mulai ? formatTime(mulai) : "";
    const range = mulai && selesai ? `${formatTime(mulai)} - ${formatTime(selesai)}` : null;
    const code = jam?.nama ?? (jadwal.jam_id ? `J-${jadwal.jam_id}` : `J-${jadwal.id}`);
    const title = kelas?.nama ?? `Kelas ${jadwal.kelas_id ?? "-"}`;
    const jp = computeJP(mulai, selesai);
    return {
      kode: code,
      time,
      title,
      subject: (Array.isArray(jadwal.mapel) ? jadwal.mapel[0]?.nama : jadwal.mapel?.nama) ?? "Algoritma Pemrograman",
      range,
      jp,
      kelasId: jadwal.kelas_id ?? null,
      jadwalId: jadwal.id,
      mulai,
      selesai,
    };
  })();

  const alreadySaved = searchParams?.get("absen") === "1";
  const returnToPath = `/today?id=${id ?? ""}`;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pb-20">
      <div className="w-full max-w-md mt-3">
        <p className="text-xs sm:text-sm md:text-lg font-bold text-gray-800 mb-2 text-center flex-1">
          <DateDisplay />
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 mb-4">
          {loading ? (
            <div className="w-full text-center text-gray-500 py-6">Memuat data jadwal...</div>
          ) : error ? (
            <div className="w-full text-center text-red-500 py-6">{error}</div>
          ) : card ? (
            <div className="w-full max-w-full">
              <div className="flex w-full items-center gap-3">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">
                    <span className="bg-sky-500 rounded p-1">{card.kode}</span>
                  </h2>
                  <h3 className="text-4xl font-extrabold text-gray-900">{card.title}</h3>
                  <div className="font-bold text-xl text-black mt-2">{card.subject}</div>

                  <div className="flex items-center gap-2 mt-2">
                    {card.range && <span className="bg-yellow-400 text-black font-bold px-3 py-1.5 rounded-full text-lg sm:text-xl">{card.range}</span>}
                    <span className="bg-gray-700 text-white font-semibold px-3 py-1.5 rounded-full text-lg sm:text-xl">{card.jp}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {alreadySaved ? (
                  <span className="block w-full bg-green-600 text-white font-extrabold text-lg rounded-xl py-3 shadow text-center">Sudah diabsen</span>
                ) : (
                  <Link href={`/attendance?kelas=${card.kelasId ?? card.jadwalId}&returnTo=${encodeURIComponent(returnToPath)}`} className="block w-full mt-4">
                    <span className="block w-full bg-sky-500 text-white font-extrabold text-lg rounded-xl py-3 shadow text-center">Buka Absen</span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-gray-600">Jam Kedua</h2>
              <h3 className="text-xl font-extrabold text-gray-900">MPLB - 1</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-yellow-400 text-black font-bold px-3 py-1.5 rounded-full text-sm sm:text-base">08:15 - 09:00</span>
                <span className="bg-gray-700 text-white font-semibold px-3 py-1.5 rounded-full text-sm sm:text-base">1 JP</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5">
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl py-3 flex items-center justify-center gap-2 shadow">
            <CheckCircle2 className="w-6 h-6" />
            Selesaikan Kelas
          </button>
        </div>
      </div>
    </div>
  );
}
