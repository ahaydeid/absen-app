"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

type KelasRow = {
  id: number;
  nama: string;
};

type JadwalRow = {
  kelas_id?: number | null;
  kelas?: { id?: number; nama?: string } | null;
};

const Page: React.FC = () => {
  const [kelas, setKelas] = useState<KelasRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createPagesBrowserClient();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) ambil session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session) {
          setKelas([]);
          setLoading(false);
          return;
        }

        // 2) cari mapping user_accounts -> user_id (referensi ke guru.id)
        const { data: acct, error: acctErr } = await supabase.from("user_accounts").select("user_id, email").eq("auth_user_id", session.user.id).maybeSingle();

        if (acctErr) console.error("Error fetching user_accounts:", acctErr);

        let userAccount = acct ?? null;

        // fallback: cari berdasarkan email jika no mapping by auth_user_id
        if (!userAccount && session.user.email) {
          const { data: byEmail, error: byEmailErr } = await supabase.from("user_accounts").select("user_id, email").eq("email", session.user.email).maybeSingle();
          if (byEmailErr) console.error("Error fetching user_accounts by email:", byEmailErr);
          userAccount = byEmail ?? null;
        }

        const guruId = userAccount?.user_id ?? null;

        // jika tidak ada mapping ke guru -> kosongkan daftar (tidak mengampu)
        if (!guruId) {
          if (mounted) setKelas([]);
          return;
        }

        // 3) ambil jadwal yang punya guru_id = guruId dan ambil relasi kelas
        const jadwalResp = await supabase.from("jadwal").select("kelas_id, kelas:kelas_id(id, nama)").eq("guru_id", guruId).not("kelas_id", "is", null);

        if (jadwalResp.error) throw jadwalResp.error;

        const jadwals = (jadwalResp.data ?? []) as JadwalRow[];

        // 4) normalisasi menjadi daftar kelas unik
        const kelasMap = new Map<number, string>();
        for (const j of jadwals) {
          const kId = j.kelas_id ?? j.kelas?.id;
          const kNama = j.kelas?.nama ?? null;
          if (kId != null) {
            // prefer nama dari joined row, fallback ke "Kelas {id}"
            const existing = kelasMap.get(kId);
            if (!existing) {
              kelasMap.set(kId, kNama ?? `Kelas ${kId}`);
            }
          }
        }

        const kelasList: KelasRow[] = Array.from(kelasMap.entries()).map(([id, nama]) => ({ id, nama }));

        if (mounted) setKelas(kelasList);
      } catch (err: unknown) {
        console.error("Load kelas (yang diampu) error:", err);
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
  }, [supabase]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-center">Daftar Kelas</h1>
        <h1 className="text-base italic text-gray-500 mb-6 text-center">(yang diampu)</h1>

        {loading ? (
          <p className="text-center text-sm text-gray-600">Memuat daftar kelas…</p>
        ) : error ? (
          <p className="text-center text-sm text-red-600">Error: {error}</p>
        ) : kelas.length === 0 ? (
          <p className="text-center text-sm text-gray-600">Belum ada kelas yang diampu.</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {kelas.map((k) => {
              return (
                <li key={k.id} className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <Link href={`/kelas/${k.id}`} className="w-full h-full bg-white/90 backdrop-blur-sm p-4 flex items-center justify-center hover:shadow-md transition-shadow" aria-label={`Buka detail kelas ${k.nama}`}>
                    <span className="text-lg font-medium">{k.nama}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Page;
