"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { User2, LogOut } from "lucide-react";

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
          mapel_id: number | null;
        };
      };
    };
  };
};

export default function Topbar({ title }: { title: string }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(true);

  const profileRef = useRef<HTMLDivElement>(null);
  const supabase = createPagesBrowserClient<Database>();
  const router = useRouter();

  // Hook untuk menutup dropdown saat klik terjadi di luar area menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Ambil nama user (dari user_accounts -> guru)
  useEffect(() => {
    let mounted = true;

    const fetchName = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        if (!session) {
          setName(null);
          setLoadingName(false);
          return;
        }

        // 1) Cari user_accounts berdasarkan auth_user_id
        const { data: acct, error: acctErr } = await supabase.from("user_accounts").select("user_id, email").eq("auth_user_id", session.user.id).maybeSingle();

        if (acctErr) console.error("Topbar: error fetching user_accounts:", acctErr);

        // Jika tidak ada mapping berdasarkan auth_user_id, coba lookup berdasarkan email
        let userAccount = acct ?? null;
        if (!userAccount) {
          if (session.user.email) {
            const { data: byEmail, error: byEmailErr } = await supabase.from("user_accounts").select("user_id, email").eq("email", session.user.email).maybeSingle();
            if (byEmailErr) console.error("Topbar: error fetching user_accounts by email:", byEmailErr);
            userAccount = byEmail ?? null;
          }
        }

        const guruId = userAccount?.user_id ?? null;

        if (!guruId) {
          // Tidak ada mapping -> tampilkan email (atau null)
          setName(session.user.email ?? null);
          return;
        }

        // 2) Ambil guru berdasarkan guruId dan ambil kolom nama
        const { data: guruRow, error: guruErr } = await supabase.from("guru").select("nama").eq("id", guruId).maybeSingle();

        if (guruErr) {
          console.error("Topbar: error fetching guru:", guruErr);
          setName(session.user.email ?? null);
          return;
        }

        if (guruRow?.nama) {
          setName(guruRow.nama);
        } else {
          setName(session.user.email ?? null);
        }
      } catch (err) {
        console.error("Topbar fetch error:", err);
        setName(null);
      } finally {
        if (mounted) setLoadingName(false);
      }
    };

    fetchName();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleProfileToggle = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setIsDropdownOpen(false);
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      // 1) sign out client-side
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 2) notify server to clear cookies
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "SIGNED_OUT", session: null }),
      });

      // 3) redirect to login and refresh
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Gagal logout. Coba lagi.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-14 max-w-7xl mx-auto px-4 flex items-center justify-between relative">
        {/* Kiri (Placeholder) */}
        <div className="flex items-center gap-3 w-9 h-9">{/* Placeholder */}</div>

        {/* Judul di tengah */}
        <h2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-gray-800 text-center truncate max-w-[60%]">{title}</h2>

        {/* Profil kanan dengan Dropdown */}
        <div className="flex items-center gap-3" ref={profileRef}>
          <h4 className="hidden sm:block text-sm font-semibold text-gray-800 whitespace-nowrap"><span className="text-gray-400">ADM</span> - {loadingName ? <span className="inline-block w-20 h-4 bg-gray-200 rounded" /> : name ?? "Pengguna"}</h4>

          <button
            onClick={handleProfileToggle}
            className="relative p-1 rounded-full text-gray-600 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-expanded={isDropdownOpen}
            aria-label="Toggle profile menu"
          >
            <User2 className="w-7 h-7" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-4 top-14 mt-1 w-48 bg-white rounded-lg shadow-xl ring-opacity-5 divide-y divide-gray-100 z-40 origin-top-right transition transform scale-100 duration-100 ease-out">
              <div className="py-1">
                {/* Link ke /profile */}
                <a href="/profile" className="flex items-center px-4 py-2 text-sm cursor-pointer text-gray-700 hover:bg-gray-200 hover:text-gray-900" onClick={() => setIsDropdownOpen(false)}>
                  <User2 className="w-4 h-4 mr-3" />
                  Profil Saya
                </a>

                {/* Logout */}
                <button onClick={handleLogout} disabled={isSigningOut} className="w-full text-left flex items-center px-4 py-2 text-sm cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700">
                  <LogOut className="w-4 h-4 mr-3" />
                  {isSigningOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
