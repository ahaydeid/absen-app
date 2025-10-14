"use client";

import React from "react";
import {
  Home,
  CalendarDays,
  Fingerprint,
  Info,
  User,
} from "lucide-react";

type Item = "home" | "jadwal" | "absen" | "info" | "profile";

export default function BottomNav({
  active = "home",
  onNavigate,
}: {
  active?: Item;
  onNavigate?: (item: Item) => void;
}) {
  const items: { id: Item; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <Home className="w-5 h-5" /> },
    { id: "jadwal", label: "Jadwal", icon: <CalendarDays className="w-5 h-5" /> },
    { id: "absen", label: "Absen", icon: <Fingerprint className="w-5 h-5" /> },
    { id: "info", label: "Info", icon: <Info className="w-5 h-5" /> },
    { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-full mx-auto flex justify-between items-center h-14 px-4">
        {items.map((it) => {
          const isActive = it.id === active;
          return (
            <button
              key={it.id}
              onClick={() => onNavigate?.(it.id)}
              aria-label={it.label}
              className={`flex-1 flex flex-col items-center justify-center text-xs py-2 focus:outline-none ${
                isActive ? "text-sky-600" : "text-gray-500"
              }`}
            >
              <div>{it.icon}</div>
              <span className="mt-1">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}