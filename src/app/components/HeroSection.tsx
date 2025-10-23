"use client";

import React, { useEffect, useState } from "react";
import DateDisplay from "@/app/components/DateDisplay";
import { User2 } from "lucide-react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

/** Minimal Database typing (sesuaikan kalau kamu punya types dari supabase gen types) */
type Database = {
  public: {
    Tables: {
      user_accounts: {
        Row: {
          auth_user_id: string;
          user_id: number | null; // reference ke guru.id
          email: string | null;
        };
      };
      guru: {
        Row: {
          id: number;
          nama: string | null;
          mapel_id: number | null; // reference ke mapel.id
        };
      };
      mapel: {
        Row: {
          id: number;
          nama: string | null;
        };
      };
    };
  };
};

const normalizeRel = <T,>(v: T | T[] | null | undefined): T | null => {
  if (!v) return null;
  return Array.isArray(v) ? (v.length ? v[0] : null) : v;
};

export default function HeroSection() {
  const [name, setName] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createPagesBrowserClient<Database>();

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session) {
          setName(null);
          setSubject(null);
          setLoading(false);
          return;
        }

        // -------------------------
        // 1) Cari user_accounts. Cari berdasarkan auth_user_id ATAU email (fallback) —
        //    sekaligus ambil relasi guru (user_accounts.user_id -> guru.id).
        // -------------------------
        const orCond = `auth_user_id.eq.${session.user.id},email.eq.${session.user.email ?? ""}`;
        const { data: acctWithGuru, error: acctErr } = await supabase
          .from("user_accounts")
          // ambil user_id,email dan relasi guru via foreign key `user_id`
          .select("user_id, email, guru:user_id(id, nama, mapel_id)")
          .or(orCond)
          .maybeSingle();

        if (acctErr) console.warn("Error fetching user_accounts (with guru):", acctErr);

        // jika tidak ada mapping sama sekali -> tampilkan email
        if (!acctWithGuru) {
          setName(session.user.email ?? "Pengguna");
          setSubject("-");
          return;
        }

        const guruRel = normalizeRel(acctWithGuru["guru"] as unknown) as { id: number; nama?: string | null; mapel_id?: number | null } | null;
        const guruId = acctWithGuru.user_id ?? guruRel?.id ?? null;

        // jika tetap nggak ada guruId -> tampilkan email
        if (!guruId) {
          setName(session.user.email ?? "Pengguna");
          setSubject("-");
          return;
        }

        // -------------------------
        // 2) Nama guru (ambil dari relasi jika ada, atau fallback ke email)
        // -------------------------
        const guruName = guruRel?.nama ?? null;
        setName(guruName ?? session.user.email ?? "Pengguna");

        // -------------------------
        // 3) Ambil mapel jika ada mapel_id
        // -------------------------
        const mapelId = guruRel?.mapel_id ?? null;
        if (mapelId) {
          const { data: mapelRow, error: mapelErr } = await supabase.from("mapel").select("nama").eq("id", mapelId).maybeSingle();
          if (mapelErr) {
            console.warn("Error fetching mapel:", mapelErr);
            setSubject("-");
          } else {
            setSubject(mapelRow?.nama ?? "-");
          }
        } else {
          setSubject("-");
        }
      } catch (err) {
        console.error("HeroSection fetch error:", err);
        setName(null);
        setSubject(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchData();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <>
      <div className="top-0 left-0 right-0 bg-white border-t border-gray-200">
        <p className="text-sm md:text-lg font-bold text-gray-800 mb-[-10] p-1 flex-1">
          <DateDisplay />
        </p>
        <div className="mx-auto flex items-center justify-between px-3 md:px-6 py-2 md:py-3">
          <div className="flex flex-col items-end flex-shrink-0 ml-auto">
            {loading ? (
              <>
                <div className="h-4 w-20 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-12 bg-gray-200 rounded" />
              </>
            ) : (
              <>
                <div className="text-gray-900 font-extrabold text-xl mb-[-5] md:text-lg">{name ?? "Pengguna"}</div>
                <div className="text-gray-700 text-base md:text-base">{subject ?? "-"}</div>
              </>
            )}
          </div>

          <div className="w-15 h-15 md:w-14 md:h-14 rounded-full border border-gray-200 flex-shrink-0 ml-2 bg-gray-600 flex items-center justify-center">
            <User2 className="w-10 h-10 md:w-10 md:h-10 text-white" role="img" aria-label="Foto Guru" />
          </div>
        </div>
      </div>
    </>
  );
}
