"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type KelasRow = {
  id: number;
  nama: string;
};

const Page: React.FC = () => {
  const [kelas, setKelas] = useState<KelasRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await supabase.from("kelas").select("id, nama").order("nama", { ascending: true });
        if (resp.error) throw resp.error;
        const data = (resp.data as KelasRow[]) || [];
        if (mounted) setKelas(data);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

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
          <p className="text-center text-sm text-gray-600">Belum ada kelas.</p>
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
