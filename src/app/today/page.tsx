"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function TodayPage() {
  const sections = [
    {
      title: "Minggu lalu",
      items: ["Pengenalan Dasar Pemrograman", "Pemrograman dalam kehidupan sehari-hari"],
      style: "bg-gray-100 text-gray-400 border-none",
      titleStyle: "text-gray-600 font-semibold",
    },
    {
      title: "Hari ini",
      items: ["Pengenalan Dasar Algoritma", "Algoritma dalam kehidupan sehari-hari"],
      style: "border-2 border-green-500 bg-white",
      titleStyle: "text-green-600 font-semibold",
    },
    {
      title: "Minggu depan",
      items: ["Pengenalan Dasar Flowchart", "Flowchart dalam kehidupan sehari-hari"],
      style: "bg-gray-100 text-gray-800 border-none",
      titleStyle: "text-gray-600 font-semibold",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pb-20">
      <div className="w-full max-w-md mt-3">
        <p className="text-sm font-bold text-gray-800 mb-3">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="flex flex-col gap-3 mb-4">
          <button className="bg-sky-500 text-white font-extrabold text-lg rounded-xl py-3 shadow"><Link href="/attendance">Absen Siswa</Link></button>
          <button className="bg-yellow-400 text-gray-900 font-semibold text-lg rounded-xl py-3 shadow">Nilai Harian</button>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 space-y-3">
          {sections.map((sec, i) => (
            <div key={i} className={`rounded-xl p-3 ${sec.style} shadow-sm`}>
              <h3 className={`text-center text-base mb-2 ${sec.titleStyle}`}>{sec.title}</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {sec.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl py-3 flex items-center justify-center gap-2 shadow">
            <CheckCircle2 className="w-6 h-6" />
            Selesaikan Kelas
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-14 flex justify-around items-center text-xs text-gray-600">
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
          </svg>
          <span>Home</span>
        </div>
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 002-2V11H3v8a2 2 0 002 2z" />
          </svg>
          <span>Jadwal</span>
        </div>
        <div className="flex flex-col items-center text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
          </svg>
          <span>Absen</span>
        </div>
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span>Info</span>
        </div>
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.63 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Profile</span>
        </div>
      </div>
    </div>
  );
}
