"use client";

import React, { useEffect, useState } from "react";
import DateDisplay from "@/components/DateDisplay";
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

        // 1) Cari entry user_accounts berdasarkan auth_user_id
        const { data: acct, error: acctErr } = await supabase.from("user_accounts").select("user_id, email").eq("auth_user_id", session.user.id).maybeSingle();

        if (acctErr) console.error("Error fetching user_accounts:", acctErr);

        // Helper fallback: jika tidak ada mapping by auth_user_id, cari berdasarkan email
        const findByEmailIfNoMapping = async (email: string | null) => {
          if (!email) return null;
          const { data: byEmail, error: byEmailErr } = await supabase.from("user_accounts").select("user_id, email").eq("email", email).maybeSingle();
          if (byEmailErr) console.error("Error fetching user_accounts by email:", byEmailErr);
          return byEmail;
        };

        let userAccount = acct ?? null;
        if (!userAccount) {
          userAccount = await findByEmailIfNoMapping(session.user.email ?? null);
        }

        const guruId = userAccount?.user_id ?? null;

        if (!guruId) {
          // Tidak ada mapping ke guru -> tampilkan email saja
          setName(session.user.email ?? "Pengguna");
          setSubject("-");
          return;
        }

        // 2) Ambil guru berdasarkan guruId (dapatkan nama dan mapel_id)
        const { data: guruRow, error: guruErr } = await supabase.from("guru").select("id, nama, mapel_id").eq("id", guruId).maybeSingle();

        if (guruErr) {
          console.error("Error fetching guru:", guruErr);
          setName(session.user.email ?? "Pengguna");
          setSubject("-");
          return;
        }

        if (!guruRow) {
          setName(session.user.email ?? "Pengguna");
          setSubject("-");
          return;
        }

        // Tampilkan nama guru (fallback ke email bila null)
        const nm = guruRow.nama ?? session.user.email ?? "Pengguna";
        setName(nm);

        // 3) Jika guru punya mapel_id, ambil nama mapel dari tabel mapel
        if (guruRow.mapel_id) {
          const { data: mapelRow, error: mapelErr } = await supabase.from("mapel").select("nama").eq("id", guruRow.mapel_id).maybeSingle();

          if (mapelErr) {
            console.error("Error fetching mapel:", mapelErr);
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

    fetchData();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <>
      <p className="text-xs sm:text-sm md:text-lg font-bold text-gray-800 mb-0 md:mb-3 flex-1">
        <DateDisplay />
      </p>
      <div className="top-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="mx-auto flex items-center justify-between px-3 md:px-6 py-2 md:py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center" />
          </div>

          <div className="flex flex-col items-end flex-shrink-0 ml-auto">
            {loading ? (
              <>
                <div className="h-4 w-20 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-12 bg-gray-200 rounded" />
              </>
            ) : (
              <>
                <div className="text-gray-900 font-extrabold text-xl mb-[-5] md:text-lg">{name ?? "Pengguna"}</div>
                <div className="text-gray-700 text-lg md:text-base">{subject ?? "-"}</div>
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
