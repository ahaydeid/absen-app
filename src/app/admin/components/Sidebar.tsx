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
  CalendarCog,
  ChevronDown,
  ChevronUp,
  School,
  BookOpen,
  ClipboardCheck,
  Loader2,
} from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [openConfig, setOpenConfig] = useState(false);
  const [openAbsen, setOpenAbsen] = useState(false); // 🔹 state baru untuk submenu Absen
  const pathname = usePathname();

  const menus = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "Hari Ini", icon: Loader2, path: "/admin/today" },
    { name: "Master Siswa", icon: Users, path: "/admin/master-siswa" },
    { name: "Master Guru", icon: GraduationCap, path: "/admin/master-guru" },
    { name: "Master Jadwal", icon: CalendarClock, path: "/admin/master-jadwal" },
    { name: "Laporan", icon: FileText, path: "/admin/laporan" },
    { name: "Absen", icon: ClipboardCheck, path: "/admin/absen" },
    { name: "Kelas", icon: School, path: "/admin/kelas" },
    { name: "Mata Pelajaran", icon: BookOpen, path: "/admin/mata-pelajaran" },
  ];

  const absenSubmenus = [
    { name: "Staff", path: "/admin/absen/staff" },
    { name: "Guru", path: "/admin/absen/guru" },
    { name: "Siswa", path: "/admin/absen/siswa" },
  ];

  const configSubmenus = [
    { name: "Config Hari", path: "/admin/config-hari" },
    { name: "Config Jam", path: "/admin/config-jam" },
  ];

  return (
    <aside className={`${isOpen ? "w-56" : "w-16"} bg-white border-r border-gray-200 pb-10 transition-all duration-300 flex sticky flex-col top-0 left-0 h-screen`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        {isOpen && <h1 className="font-bold text-lg text-gray-800">Admin</h1>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-gray-100">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu utama */}
      <nav className="flex-1 overflow-y-auto mt-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {menus.map((menu, index) => {
          const Icon = menu.icon;
          const isActive = pathname === menu.path;

          // 🔹 Deteksi menu Absen untuk dikasih toggle
          if (menu.name === "Absen") {
            return (
              <div key={index}>
                <button
                  onClick={() => setOpenAbsen(!openAbsen)}
                  className={`flex items-center gap-3 w-full p-3 cursor-pointer transition text-sm ${isOpen ? "justify-start px-4" : "justify-center"} ${
                    pathname.startsWith("/admin/absen") ? "bg-sky-600 text-white font-semibold" : "text-gray-700 hover:bg-sky-50"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && (
                    <div className="flex justify-between items-center w-full">
                      <span>Absen</span>
                      {openAbsen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  )}
                </button>

                {/* Submenu Absen */}
                {openAbsen && isOpen && (
                  <div className="ml-10 mt-1">
                    {absenSubmenus.map((sub, i) => (
                      <Link key={i} href={sub.path}>
                        <div className={`block px-2 py-2 text-sm rounded-md transition ${pathname === sub.path ? "text-white font-semibold bg-sky-600" : "text-gray-700 hover:bg-gray-50"}`}>{sub.name}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // 🔹 Menu lainnya tetap seperti semula
          return (
            <Link key={index} href={menu.path}>
              <div className={`flex items-center gap-3 w-full p-3 cursor-pointer transition text-sm ${isOpen ? "justify-start px-4" : "justify-center"} ${isActive ? "bg-sky-600 text-white font-semibold" : "text-gray-700 hover:bg-sky-50"}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>{menu.name}</span>}
              </div>
            </Link>
          );
        })}

        {/* Bagian Konfigurasi Jadwal tetap sama */}
        <div className="mt-1">
          <button
            onClick={() => setOpenConfig(!openConfig)}
            className={`flex items-center gap-3 w-full p-3 cursor-pointer transition text-sm ${isOpen ? "justify-start px-4" : "justify-center"} ${
              pathname.startsWith("/admin/config-jadwal") ? "bg-sky-600 text-white font-semibold" : "text-gray-700 hover:bg-sky-50"
            }`}
          >
            <CalendarCog className="w-5 h-5 flex-shrink-0" />
            {isOpen && (
              <div className="flex justify-between items-center w-full">
                <span>Konfigurasi Jadwal</span>
                {openConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            )}
          </button>

          {openConfig && isOpen && (
            <div className="ml-10 mt-1">
              {configSubmenus.map((sub, i) => (
                <Link key={i} href={sub.path}>
                  <div className={`block px-2 py-2 text-sm rounded-md transition ${pathname === sub.path ? "text-white font-semibold bg-sky-600" : "text-gray-700 hover:bg-gray-50"}`}>{sub.name}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
