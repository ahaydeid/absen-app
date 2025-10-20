// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Fingerprint, Info, User } from "lucide-react";

type Item = "home" | "jadwal" | "absen" | "info" | "profile";

export default function BottomNav({ active = "home" }: { active?: Item }) {
  const pathname = usePathname();

  // jangan tampilkan BottomNav di halaman login (atau route publik lain)
  if (!pathname) return null;
  const HIDE_ON = ["/login", "/signup", "/forgot-password"]; // tambahkan path lain jika perlu
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  const items: { id: Item; label: string; icon: React.ReactNode; href: string }[] = [
    { id: "home", label: "Home", icon: <Home className="w-6 h-6" />, href: "/" },
    { id: "jadwal", label: "Jadwal", icon: <CalendarDays className="w-6 h-6" />, href: "/schedule" },
    { id: "absen", label: "Absen", icon: <Fingerprint className="w-6 h-6" />, href: "/guru-attendance" },
    { id: "info", label: "Info", icon: <Info className="w-6 h-6" />, href: "/info" },
    { id: "profile", label: "Profile", icon: <User className="w-6 h-6" />, href: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-full mx-auto flex justify-between items-center h-15 px-4">
        {items.map((it) => {
          const isActive = it.id === active;
          return (
            <Link key={it.id} href={it.href} className={`flex-1 flex flex-col items-center justify-center text-xs py-2 focus:outline-none transition ${isActive ? "text-gray-900" : "text-gray-500"}`}>
              <div>{it.icon}</div>
              <span className="mt-1">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
