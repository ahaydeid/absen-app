"use client";

import Link from "next/link";
import { BookOpen, Calendar, CalendarClock, NotebookPen, FileBarChart, Layers } from "lucide-react";

type Menu = {
  title: string;
  icon: React.ReactNode;
  href: string;
};

export default function MenuSection() {
  const menus: Menu[] = [
    { title: "Jadwal", icon: <Calendar className="w-7 h-7 text-amber-500" />, href: "/schedule" },
    { title: "Kelas", icon: <BookOpen className="w-7 h-7 text-sky-600" />, href: "/kelas" },
    { title: "Log Absen", icon: <CalendarClock className="w-7 h-7 text-rose-500" />, href: "/log-absen" },
    { title: "Log Nilai", icon: <NotebookPen className="w-7 h-7 text-indigo-500" />, href: "/log-nilai" },
    { title: "Export Laporan", icon: <FileBarChart className="w-7 h-7 text-cyan-500" />, href: "/laporan" },
    { title: "Buat RPP", icon: <Layers className="w-7 h-7 text-emerald-500" />, href: "/rpp" },
  ];

  return (
    <section className="bg-white rounded-xl p-5 grid grid-cols-4 sm:grid-cols-5 gap-4 mt-4 shadow-sm">
      {menus.map((menu) => (
        <Link
          key={menu.title}
          href={menu.href}
          aria-label={menu.title}
          className="flex flex-col items-center text-center text-sm text-gray-700 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300 rounded-md"
        >
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gray-50">{menu.icon}</div>
          <span className="mt-2 text-[13px] font-medium">{menu.title}</span>
        </Link>
      ))}
    </section>
  );
}
