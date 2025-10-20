// app/absen/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type AbsenRow = {
  id: number;
  tanggal: string; // 'YYYY-MM-DD'
  jadwal_id?: number | null;
  statuses?: unknown; // bisa object atau string
};

type SiswaRow = {
  id: number;
  nama: string;
};

type JadwalRow = {
  id: number;
  kelas_id?: number | null;
};

type KelasRow = {
  id: number;
  nama: string;
};

type StatusKey = "hadir" | "sakit" | "izin" | "alfa" | string;

type SiswaStatus = {
  id: number;
  nama: string;
  status: StatusKey;
};

export default function DetailAbsenPageClient() {
  const params = useParams();
  const idParam = params?.id;
  const absenId = typeof idParam === "string" ? Number(idParam) : NaN;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [absen, setAbsen] = useState<AbsenRow | null>(null);
  const [kelasNama, setKelasNama] = useState<string | null>(null);
  const [siswaList, setSiswaList] = useState<SiswaStatus[]>([]);

  useEffect(() => {
    if (!absenId || Number.isNaN(absenId)) {
      setError("ID absen tidak valid");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      setKelasNama(null);
      setSiswaList([]);

      try {
        // 1) ambil baris absen
        const absenResp = await supabase.from("absen").select("id, tanggal, jadwal_id, statuses").eq("id", absenId).single();
        if (absenResp.error) throw absenResp.error;
        const absenData = absenResp.data as AbsenRow | null;
        if (!absenData) {
          setError("Data absen tidak ditemukan");
          setLoading(false);
          return;
        }
        setAbsen(absenData);

        // 1.5) Ambil nama kelas berdasarkan jadwal_id -> jadwal.kelas_id -> kelas.nama
        if (absenData.jadwal_id != null) {
          const jadwalResp = await supabase.from("jadwal").select("id, kelas_id").eq("id", absenData.jadwal_id).single();
          if (jadwalResp.error && jadwalResp.error.code !== "PGRST116") {
            // PGRST116 sometimes appears for empty single — treat as not found
            throw jadwalResp.error;
          }
          const jadwalData = jadwalResp.data as JadwalRow | null;

          if (jadwalData?.kelas_id != null) {
            const kelasResp = await supabase.from("kelas").select("id, nama").eq("id", jadwalData.kelas_id).single();
            if (kelasResp.error && kelasResp.error.code !== "PGRST116") throw kelasResp.error;
            const kelasData = kelasResp.data as KelasRow | null;
            setKelasNama(kelasData?.nama ?? "—");
          } else {
            setKelasNama("—");
          }
        } else {
          setKelasNama("—");
        }

        // 2) parse statuses menjadi Record<string, number[]>
        let statusesObj: Record<string, number[]> = {};
        if (absenData.statuses == null) {
          statusesObj = {};
        } else if (typeof absenData.statuses === "string") {
          // kalau disimpan sebagai string JSON
          try {
            const parsed = JSON.parse(absenData.statuses);
            if (parsed && typeof parsed === "object") {
              Object.entries(parsed).forEach(([k, v]) => {
                if (Array.isArray(v)) {
                  statusesObj[k] = v.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
                } else {
                  statusesObj[k] = [];
                }
              });
            }
          } catch {
            statusesObj = {};
          }
        } else if (typeof absenData.statuses === "object") {
          const raw = absenData.statuses as Record<string, unknown>;
          Object.entries(raw).forEach(([k, v]) => {
            if (Array.isArray(v)) {
              statusesObj[k] = v.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
            } else {
              statusesObj[k] = [];
            }
          });
        } else {
          statusesObj = {};
        }

        // 3) kumpulkan semua id siswa yang ada di statuses
        const allIds = new Set<number>();
        Object.values(statusesObj).forEach((arr) => {
          arr.forEach((id) => allIds.add(Number(id)));
        });
        const siswaIds = Array.from(allIds).filter((n) => !Number.isNaN(n));

        if (siswaIds.length === 0) {
          setSiswaList([]);
          setLoading(false);
          return;
        }

        // 4) ambil data siswa dari tabel "siswa"
        const siswaResp = await supabase.from("siswa").select("id, nama").in("id", siswaIds);
        if (siswaResp.error) throw siswaResp.error;
        const siswaData = (siswaResp.data as SiswaRow[] | null) || [];

        // 5) buat map id -> nama
        const siswaById = new Map<number, string>();
        siswaData.forEach((s) => siswaById.set(s.id, s.nama));

        /* --- PERUBAHAN DI SINI ---
           Tujuan: jangan urutkan berdasarkan status; urutkan alfabet berdasarkan nama.
           Namun kita tetap gunakan prioritas status untuk memilih status jika ada duplikasi.
        */

        // 6a) buat map id -> status berdasarkan prioritas
        const statusPriority: StatusKey[] = ["hadir", "sakit", "izin", "alfa"];
        const idToStatus = new Map<number, StatusKey>();

        // pertama, assign berdasarkan priority (lebih tinggi menang)
        statusPriority.forEach((key) => {
          const ids = statusesObj[key] || [];
          ids.forEach((sid) => {
            if (!idToStatus.has(sid)) {
              idToStatus.set(sid, key);
            }
          });
        });

        // lalu assign status non-priority untuk id yang belum punya status
        Object.keys(statusesObj)
          .filter((k) => !statusPriority.includes(k as StatusKey))
          .forEach((key) => {
            statusesObj[key].forEach((sid) => {
              if (!idToStatus.has(sid)) {
                idToStatus.set(sid, key as StatusKey);
              }
            });
          });

        // 6b) bangun array SiswaStatus dari semua siswaIds, isi nama dari siswaById (fallback ke `ID ${id}`)
        const result: SiswaStatus[] = siswaIds.map((sid) => ({
          id: sid,
          nama: siswaById.get(sid) ?? `ID ${sid}`,
          status: idToStatus.get(sid) ?? "—",
        }));

        // 6c) sort berdasarkan nama alfabet (case-insensitive)
        result.sort((a, b) => {
          const na = String(a.nama).toLowerCase();
          const nb = String(b.nama).toLowerCase();
          if (na < nb) return -1;
          if (na > nb) return 1;
          return a.id - b.id;
        });

        setSiswaList(result);
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [absenId]);

  // helper render badge
  const renderBadge = (status: StatusKey) => {
    const map: Record<string, { classes: string; content: React.ReactNode; ariaLabel?: string }> = {
      hadir: {
        classes: "inline-flex items-center px-3 py-2 rounded text-sm font-extrabold bg-green-600 text-white",
        content: (
          <>
            <Check className="w-4 h-4" />
            <span className="sr-only">Hadir</span>
          </>
        ),
        ariaLabel: "Hadir",
      },
      sakit: {
        classes: "inline-flex items-center px-4 py-1 rounded text-sm font-extrabold bg-yellow-400 text-gray-900",
        content: "S",
      },
      izin: {
        classes: "inline-flex items-center px-4 py-1 rounded text-sm font-extrabold bg-sky-400 text-white",
        content: "I",
      },
      alfa: {
        classes: "inline-flex items-center px-4 py-1 rounded text-sm font-extrabold bg-red-500 text-white",
        content: "A",
      },
    };

    const entry =
      map[status] ??
      ({
        classes: "inline-flex items-center px-3 py-1 rounded text-sm font-semibold bg-gray-200 text-gray-800",
        content: String(status).slice(0, 1).toUpperCase(),
        ariaLabel: status,
      } as const);

    return (
      <span className={entry.classes} aria-label={entry.ariaLabel}>
        {entry.content}
      </span>
    );
  };

  // format tanggal sederhana: YYYY-MM-DD -> DD/MM/YYYY (jika ada)
  const formatTanggal = (raw?: string | null) => {
    if (!raw) return "-";
    const parts = raw.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return raw;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-3">
        <header className="gap-2 mb-2">
          <div>
            <h1 className="text-sm ms-3 mb-3 font-bold text-gray-500">Detail Absen</h1>
          </div>
          <div className="text-left ms-3">
            {absen && <div className="text-3xl font-bold text-gray-700 mt-1">{kelasNama ?? "—"}</div>}
            <h6 className="text-sm text-gray-700 italic">{formatTanggal(absen?.tanggal)}</h6>
          </div>
        </header>

        <div className="border-t border-gray-100">
          {loading ? (
            <p className="py-4 text-gray-600">Memuat data siswa...</p>
          ) : error ? (
            <p className="py-4 text-red-600">Error: {error}</p>
          ) : siswaList.length === 0 ? (
            <p className="py-4 text-gray-600">Tidak ada data siswa pada absen ini.</p>
          ) : (
            <ul className="divide-y">
              {siswaList.map((s, idx) => (
                <li key={s.id} className="flex items-center justify-between py-2 px-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center text-sm font-medium text-gray-700">{idx + 1}.</span>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{s.nama}</div>
                    </div>
                  </div>

                  {/* Right: badge status */}
                  <div>{renderBadge(s.status)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
