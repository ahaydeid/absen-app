"use client";

import React, { useEffect, useState } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import JadwalHariCard from "../components/JadwalHariCard";

type DayRow = { id: number; nama: string };
type RelOneOrMany<T> = T | T[] | null;
type RawJadwal = {
  id: number;
  hari_id?: number | null;
  jam_id?: number | null;
  kelas_id?: number | null;
  jp?: number | null;
  guru_id?: number | null; // tambahan: guru_id
  kelas?: RelOneOrMany<{ nama?: string }>;
  jam?: RelOneOrMany<{ nama?: string; mulai?: string; selesai?: string }>;
  jumlah_jam?: RelOneOrMany<{ nama?: string }>;
};

export default function Page(): React.ReactElement {
  const [days, setDays] = useState<DayRow[]>([]);
  const [jadwals, setJadwals] = useState<RawJadwal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // gunakan Pages Browser Client agar memakai session auth client-side
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // ambil session & user
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session) {
          setDays([]);
          setJadwals([]);
          setLoading(false);
          return;
        }

        // 0) cari mapping user_accounts -> user_id (referensi ke guru.id)
        const { data: acct, error: acctErr } = await supabase.from("user_accounts").select("user_id, email").eq("auth_user_id", session.user.id).maybeSingle();

        if (acctErr) console.error("Error fetching user_accounts:", acctErr);

        let userAccount = acct ?? null;

        // fallback: cari berdasarkan email jika tidak ada mapping by auth_user_id
        if (!userAccount && session.user.email) {
          const { data: byEmail, error: byEmailErr } = await supabase.from("user_accounts").select("user_id, email").eq("email", session.user.email).maybeSingle();
          if (byEmailErr) console.error("Error fetching user_accounts by email:", byEmailErr);
          userAccount = byEmail ?? null;
        }

        const guruId = userAccount?.user_id ?? null;

        // Ambil daftar hari (sama seperti sebelumnya)
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

        // jika tidak ada mapping guru untuk user -> jangan tampilkan jadwal apapun
        if (!guruId) {
          setJadwals([]);
          setLoading(false);
          return;
        }

        // 2) ambil semua jadwal untuk hari-hari yang ada, tapi hanya untuk guru_id yang sesuai
        const hariIds = daysData.map((d) => d.id);
        const selectStr = "id, hari_id, jam_id, kelas_id, jp, guru_id, " + "kelas:kelas_id(nama), jam:jam_id(nama,mulai,selesai), jumlah_jam:jp(nama)";

        const jadwalResp = await supabase.from("jadwal").select(selectStr).in("hari_id", hariIds).eq("guru_id", guruId).order("hari_id", { ascending: true }).order("jam_id", { ascending: true });

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
  }, [supabase]);

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
          <div className="space-y-4">
            {days.map((day) => {
              const list = jadwalMap.get(day.id) ?? [];
              return <JadwalHariCard key={day.id} day={day} list={list} />;
            })}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
