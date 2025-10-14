"use client";

import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";

export default function TodaySection() {
  const items = [
    {
      id: 1,
      code: "J-2",
      time: "08:15",
      title: "MPLB 1",
      subject: "Algoritma Pemrograman",
      range: "08:15 - 09:45",
      jp: "2 JP",
      status: null,
    },
    {
      id: 2,
      code: "J-4",
      time: "10:30",
      title: "TKR",
      subject: "Algoritma Pemrograman",
      range: "10:30 - 11:15",
      jp: "1 JP",
      status: null,
    },
    {
      id: 3,
      code: "MPLB 2",
      time: "",
      title: "MPLB 2",
      subject: "Algoritma Pemrograman",
      range: null,
      jp: "1 JP",
      status: "Selesai",
    },
  ];

  return (
    <section className="mt-5 bg-white rounded-xl p-4 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Hari ini</h2>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 relative"
          >
            {/* Left icon box */}
            {item.status === "Selesai" ? (
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-green-500 text-white">
                <Check className="w-7 h-7" strokeWidth={3} />
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center w-16 h-16 rounded-xl bg-sky-500 text-white font-bold">
                <div className="text-sm">{item.code}</div>
                <div className="text-xs mt-1">{item.time}</div>
              </div>
            )}

            {/* Middle content */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-base font-extrabold text-gray-900">{item.title}</div>
                  <div className="italic text-gray-600 text-sm">{item.subject}</div>
                </div>
                <Link href="/today"><ArrowUpRight className="w-5 h-5 text-gray-400" /></Link>
                
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                {item.range && (
                  <span className="text-xs bg-yellow-300 text-gray-900 font-medium px-2 py-1 rounded-full">
                    {item.range}
                  </span>
                )}

                {item.status === "Selesai" && (
                  <span className="text-xs bg-green-500 text-white font-semibold px-2 py-1 rounded-full">
                    Selesai
                  </span>
                )}

                <span className="text-xs bg-gray-400 text-white font-medium px-2 py-1 rounded-full">
                  {item.jp}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}