"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Home, CalendarDays, Fingerprint, Info, User, LogOut } from "lucide-react";

type Item = "home" | "jadwal" | "absen" | "info" | "profile";

export default function BottomNav({ active = "home" }: { active?: Item }) {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [sessionExists, setSessionExists] = useState<boolean | null>(null); // null = loading
  const profileRef = useRef<HTMLDivElement>(null);
  const supabase = createPagesBrowserClient();
  const router = useRouter();

  // check session on mount and listen to auth changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setSessionExists(Boolean(session));
      } catch (err) {
        console.error("Failed to get session:", err);
        if (!mounted) return;
        setSessionExists(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionExists(Boolean(session));
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [supabase]);

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileRef]);

  const items: { id: Item; label: string; icon: React.ReactNode; href: string }[] = [
    { id: "home", label: "Home", icon: <Home className="w-6 h-6" />, href: "/" },
    { id: "jadwal", label: "Jadwal", icon: <CalendarDays className="w-6 h-6" />, href: "/schedule" },
    { id: "absen", label: "Absen", icon: <Fingerprint className="w-6 h-6" />, href: "/guru-attendance" },
    { id: "info", label: "Info", icon: <Info className="w-6 h-6" />, href: "/info" },
    { id: "profile", label: "Profile", icon: <User className="w-6 h-6" />, href: "/profile" },
  ];

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProfileDropdownOpen((prev) => !prev);
  };

  // Logout handler
  const handleLogout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setIsProfileDropdownOpen(false);
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      // 1) sign out client-side
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 2) notify server to clear cookies (ensure /api/auth exists and clears cookies)
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
      // optionally show toast / alert — simple fallback:
      alert("Gagal logout. Coba lagi.");
    } finally {
      setIsSigningOut(false);
    }
  };

  // While we are checking session, don't render anything (avoid flicker)
  if (sessionExists === null) return null;

  // If there's no session, hide BottomNav
  if (!sessionExists) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="max-w-full mx-auto flex justify-between items-center h-15 px-4">
        {items.map((it) => {
          const isActive = it.id === active;

          if (it.id === "profile") {
            return (
              <div
                key={it.id}
                ref={profileRef}
                className={`flex-1 flex flex-col items-center justify-center text-xs py-2 focus:outline-none transition relative cursor-pointer ${isActive || isProfileDropdownOpen ? "text-gray-900 font-medium" : "text-gray-500"}`}
                onClick={handleProfileClick}
              >
                <div>{it.icon}</div>
                <span className="mt-1">{it.label}</span>

                {isProfileDropdownOpen && (
                  <div className="absolute bottom-full mb-2 w-40 bg-white rounded-lg shadow-xl ring-opacity-5 overflow-hidden z-20 transform -translate-x-1/2 left-1/2">
                    <a href={it.href} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out" onClick={() => setIsProfileDropdownOpen(false)}>
                      <User className="w-4 h-4 mr-2" />
                      Profil Saya
                    </a>

                    <button onClick={handleLogout} disabled={isSigningOut} className="w-full cursor-pointer text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition duration-150 ease-in-out">
                      <LogOut className="w-4 h-4 mr-2" />
                      {isSigningOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                )}
              </div>
            );
          }

          // Default Links
          return (
            <a key={it.id} href={it.href} className={`flex-1 flex flex-col items-center justify-center text-xs py-2 focus:outline-none transition ${isActive ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"}`}>
              <div>{it.icon}</div>
              <span className="mt-1">{it.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
