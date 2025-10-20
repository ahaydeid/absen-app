"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type SiswaRow = {
  id: number;
  nama: string;
  kelas_id?: number | null;
};

type KelasRow = {
  id: number;
  nama: string;
};

const KelasDetailPage: React.FC = () => {
  const params = useParams();
  const idParam = params?.id;
  const kelasId = typeof idParam === "string" ? Number(idParam) : NaN;

  const [kelasNama, setKelasNama] = useState<string>("—");
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kelasId || Number.isNaN(kelasId)) {
      setError("ID kelas tidak valid");
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // ambil nama kelas (opsional)
        const kResp = await supabase.from("kelas").select("id, nama").eq("id", kelasId).single();
        if (!kResp.error && kResp.data) {
          if (mounted) setKelasNama((kResp.data as KelasRow).nama ?? "—");
        }

        // ambil siswa berdasarkan kelas_id, urut abjad
        const sResp = await supabase.from("siswa").select("id, nama, kelas_id").eq("kelas_id", kelasId).order("nama", { ascending: true });

        if (sResp.error) throw sResp.error;
        const sdata = (sResp.data as SiswaRow[]) || [];
        if (mounted) setSiswaList(sdata);
      } catch (err: unknown) {
        console.error(err);
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [kelasId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-4">
        <header className="mb-4">
          <h1 className="text-sm ms-3 mb-1 font-bold text-gray-500">Daftar siswa</h1>

          <div className="text-left ms-3">
            <div className="text-3xl font-bold text-gray-700 mt-1">{kelasNama}</div>
          </div>
        </header>

        <div className="border-t border-gray-100 pt-3">
          {loading ? (
            <p className="py-4 text-gray-600 px-5">Memuat data siswa...</p>
          ) : error ? (
            <p className="py-4 text-red-600 px-5">Error: {error}</p>
          ) : siswaList.length === 0 ? (
            <p className="py-4 text-gray-600 px-5">Belum ada siswa pada kelas ini.</p>
          ) : (
            <ul className="divide-y">
              {siswaList.map((s, idx) => (
                <li key={s.id} className="flex items-center justify-start gap-4 py-3 px-5">
                  <span className="inline-flex items-center justify-center text-sm font-medium text-gray-700">{idx + 1}.</span>

                  <div>
                    <div className="text-sm font-medium text-gray-800">{s.nama}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default KelasDetailPage;
