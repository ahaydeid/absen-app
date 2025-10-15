"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarClock,
  FileText,
  Menu,
  X,
} from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const menus = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "Master Siswa", icon: Users, path: "/admin/master-siswa" },
    { name: "Master Guru", icon: GraduationCap, path: "/admin/master-guru" },
    { name: "Master Jadwal", icon: CalendarClock, path: "/admin/master-jadwal" },
    { name: "Laporan", icon: FileText, path: "/admin/laporan" },
    { name: "Kelas", icon: Users, path: "/admin/kelas" },
    { name: "Mata Pelajaran", icon: FileText, path: "/admin/mata-pelajaran" },
    { name: "Absensi", icon: CalendarClock, path: "/admin/absensi" },
    { name: "Nilai", icon: GraduationCap, path: "/admin/nilai" },
    { name: "RPP", icon: FileText, path: "/admin/rpp" },
    { name: "Data Sekolah", icon: LayoutDashboard, path: "/admin/data-sekolah" },
    { name: "Pengguna", icon: Users, path: "/admin/pengguna" },
    { name: "Perizinan", icon: CalendarClock, path: "/admin/perizinan" },
    { name: "Pengaturan", icon: FileText, path: "/admin/pengaturan" },
    { name: "Log Aktivitas", icon: LayoutDashboard, path: "/admin/log-aktivitas" },
  ];

  return (
    <aside
      className={`${
        isOpen ? "w-56" : "w-16"
      } bg-white border-r border-gray-200 pb-10 transition-all duration-300 flex flex-col fixed top-0 left-0 h-screen`}
    >
      {/* Header (tetap di atas) */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0 sticky top-0 bg-white z-10">
        {isOpen && <h1 className="font-bold text-lg text-gray-800">Admin</h1>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu scrollable */}
      <nav className="flex-1 overflow-y-auto mt-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {menus.map((menu, index) => {
          const Icon = menu.icon;
          const isActive = pathname === menu.path;

          return (
            <Link key={index} href={menu.path}>
              <div
                className={`flex items-center gap-3 w-full p-3 cursor-pointer transition text-sm ${
                  isOpen ? "justify-start px-4" : "justify-center"
                } ${
                  isActive
                    ? "bg-sky-100 text-sky-600 font-semibold"
                    : "text-gray-700 hover:bg-sky-50"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>{menu.name}</span>}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}