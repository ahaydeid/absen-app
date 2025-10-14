"use client";

import { BookOpen, CalendarClock, NotebookPen, FileBarChart, Layers } from "lucide-react";

export default function MenuSection() {
  const menus = [
    { title: "Kelas", icon: <BookOpen className="w-7 h-7 text-sky-600" /> },
    { title: "Log Absen", icon: <CalendarClock className="w-7 h-7 text-rose-500" /> },
    { title: "Log Nilai", icon: <NotebookPen className="w-7 h-7 text-indigo-500" /> },
    { title: "Export Laporan", icon: <FileBarChart className="w-7 h-7 text-cyan-500" /> },
    { title: "Buat RPP", icon: <Layers className="w-7 h-7 text-emerald-500" /> },
  ];

  return (
    <section className="bg-white rounded-xl p-5 grid grid-cols-4 sm:grid-cols-5 gap-4 mt-4 shadow-sm">
      {menus.map((menu) => (
        <div
          key={menu.title}
          className="flex flex-col items-center text-center text-sm text-gray-700 cursor-pointer hover:opacity-80"
        >
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gray-50">
            {menu.icon}
          </div>
          <span className="mt-2 text-[13px] font-medium">{menu.title}</span>
        </div>
      ))}
    </section>
  );
}