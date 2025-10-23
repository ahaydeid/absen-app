"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  guru_id?: number | null;
  kelas?: RelOneOrMany<{ nama?: string }>;
  jam?: RelOneOrMany<{ nama?: string; mulai?: string; selesai?: string }>;
  jumlah_jam?: RelOneOrMany<{ nama?: string }>;
};

// Fungsi utilitas untuk mengubah waktu string (HH:MM:SS) menjadi menit
const toMinutes = (time: string | null): number => {
  if (!time) return 9999; // Jika null, beri nilai besar agar diurutkan ke bawah
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
};

export default function Page(): React.ReactElement {
  const [days, setDays] = useState<DayRow[]>([]);
  const [jadwals, setJadwals] = useState<RawJadwal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // gunakan Pages Browser Client agar memakai session auth client-side
  const supabase = useMemo(() => createPagesBrowserClient(), []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
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

        // Ambil daftar hari (Senin - Sabtu, ID 1-6)
        const daysResp = await supabase.from("hari").select("id, nama").gte("id", 1).lte("id", 6).order("id", { ascending: true });

        if (daysResp.error) throw daysResp.error;

        const daysData = (daysResp.data ?? []) as DayRow[];

        if (!mounted) return;
        setDays(daysData);

        if (daysData.length === 0 || !guruId) {
          setJadwals([]);
          setLoading(false);
          return;
        }

        // 2) ambil semua jadwal untuk guru dan hari yang sesuai.
        // Order by hari_id (wajib), tapi order jam_id dihapus karena kita akan sort by jam.mulai di klien.
        const hariIds = daysData.map((d) => d.id);
        const selectStr = "id, hari_id, jam_id, kelas_id, jp, guru_id, " + "kelas:kelas_id(nama), jam:jam_id(nama,mulai,selesai), jumlah_jam:jp(nama)";

        const jadwalResp = await supabase.from("jadwal").select(selectStr).in("hari_id", hariIds).eq("guru_id", guruId).order("hari_id", { ascending: true }); // order jam_id dihapus

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

    // --- SORTING BERDASARKAN WAKTU MULAI (JAM.MULAI) ---
    // Iterasi melalui setiap hari dan urutkan jadwal di dalamnya.
    m.forEach((list, hariId) => {
      // Pastikan list jam memiliki properti jam.mulai dan urutkan secara ascending (paling awal di atas)
      list.sort((a, b) => {
        // Ambil waktu mulai, pastikan itu adalah objek tunggal jika RelOneOrMany
        const mulaiA = Array.isArray(a.jam) ? a.jam[0]?.mulai ?? null : a.jam?.mulai ?? null;
        const mulaiB = Array.isArray(b.jam) ? b.jam[0]?.mulai ?? null : b.jam?.mulai ?? null;
        
        const timeA = toMinutes(mulaiA);
        const timeB = toMinutes(mulaiB);

        return timeA - timeB; // Ascending sort
      });
      m.set(hariId, list);
    });
    // --------------------------------------------------

    return m;
  }, [jadwals]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-4 pb-28">
      <div className="mx-auto w-full px-4 max-w-xl md:max-w-2xl lg:max-w-3xl">
        <h1 className="text-center text-2xl md:text-[20px] font-extrabold mb-4">Jadwal Mengajar</h1>

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

        {days.length > 0 && jadwalMap.size === 0 && (
            <div className="text-center text-white mt-8 p-4 bg-red-600">
              Anda tidak memiliki jadwal mengajar.
            </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
