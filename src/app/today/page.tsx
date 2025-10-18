"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import DateDisplay from "@/components/DateDisplay";

export default function TodayPage() {
  // const sections = [
  //   {
  //     title: "Minggu lalu",
  //     items: ["Pengenalan Dasar Pemrograman", "Pemrograman dalam kehidupan sehari-hari"],
  //     style: "bg-gray-100 text-gray-400 border-none",
  //     titleStyle: "text-gray-600 font-semibold",
  //   },
  //   {
  //     title: "Hari ini",
  //     items: ["Pengenalan Dasar Algoritma", "Algoritma dalam kehidupan sehari-hari"],
  //     style: "border-2 border-green-500 bg-white",
  //     titleStyle: "text-green-600 font-semibold",
  //   },
  //   {
  //     title: "Minggu depan",
  //     items: ["Pengenalan Dasar Flowchart", "Flowchart dalam kehidupan sehari-hari"],
  //     style: "bg-gray-100 text-gray-800 border-none",
  //     titleStyle: "text-gray-600 font-semibold",
  //   },
  // ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pb-20">
      <div className="w-full max-w-md mt-3">
        <p className="text-xs sm:text-sm md:text-lg font-bold text-gray-800 mb-2 text-center flex-1">
          <DateDisplay />
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 mb-4 flex items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-600">Jam Kedua</h2>
            <h3 className="text-xl font-extrabold text-gray-900">MPLB - 1</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-yellow-400 text-black font-bold px-3 py-1.5 rounded-full text-sm sm:text-base">08:15 - 09:00</span>
              <span className="bg-gray-700 text-white font-semibold px-3 py-1.5 rounded-full text-sm sm:text-base">1 JP</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <button className="bg-sky-500 text-white font-extrabold text-lg rounded-xl py-3 shadow">
            <Link href="/attendance">Absen Siswa</Link>
          </button>
          {/* <button className="bg-yellow-400 text-gray-900 font-semibold text-lg rounded-xl py-3 shadow">Nilai Harian</button> */}
        </div>

        {/* <div className="bg-gray-50 rounded-xl p-3 space-y-3">
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
        </div> */}

        {/* Tombol selesai */}
        <div className="mt-5">
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl py-3 flex items-center justify-center gap-2 shadow">
            <CheckCircle2 className="w-6 h-6" />
            Selesaikan Kelas
          </button>
        </div>
      </div>
    </div>
  );
}
