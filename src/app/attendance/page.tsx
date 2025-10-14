"use client";

import { useRef, useState, useEffect } from "react";
import { Check } from "lucide-react";

interface Student {
  id: number;
  name: string;
  status: "" | "H" | "S" | "I" | "A";
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: "Raka Pratama", status: "" },
    { id: 2, name: "Aldi Pratama", status: "" },
    { id: 3, name: "Siti Nurhaliza", status: "" },
    { id: 4, name: "Intan Permata Sari", status: "" },
    { id: 5, name: "Rizky Maulana Akbar", status: "" },
    { id: 6, name: "Dian Anggraini", status: "" },
    { id: 7, name: "Bagas Aditya Putra", status: "" },
    { id: 8, name: "Nadya Kusuma Putri", status: "" },
    { id: 9, name: "Fajar Ramadhan", status: "" },
    { id: 10, name: "Maya Salsabila Anjani", status: "" },
    { id: 11, name: "Reza Alfian", status: "" },
    { id: 12, name: "Aulia Rahman", status: "" },
    { id: 13, name: "Yuliana Dewi", status: "" },
    { id: 14, name: "Andika Saputra", status: "" },
    { id: 15, name: "Nisa Amelia", status: "" },
    { id: 16, name: "Kevin Nugraha", status: "" },
    { id: 17, name: "Putri Andayani", status: "" },
    { id: 18, name: "Farhan Prasetyo", status: "" },
    { id: 19, name: "Salsa Khairunnisa", status: "" },
    { id: 20, name: "Ilham Setiawan", status: "" },
    { id: 21, name: "Citra Anggraini", status: "" },
    { id: 22, name: "Yoga Permana", status: "" },
    { id: 23, name: "Dewi Sartika", status: "" },
    { id: 24, name: "Bima Arya", status: "" },
    { id: 25, name: "Rani Safitri", status: "" },
    { id: 26, name: "Teguh Santoso", status: "" },
    { id: 27, name: "Ayu Lestari", status: "" },
    { id: 28, name: "Hafidz Ramadhan", status: "" },
    { id: 29, name: "Zahra Oktaviani", status: "" },
    { id: 30, name: "Bayu Kurniawan", status: "" },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);

  const scrollToStudent = (index: number) => {
    if (!listRef.current) return;
    const el = listRef.current.children[index] as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Update currentIndex saat scroll manual berdasarkan elemen yang paling dekat dengan tengah kontainer
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return;
      const container = listRef.current;
      const containerCenter = container.scrollTop + container.clientHeight / 2;
      let closestIndex = 0;
      let smallestDistance = Infinity;

      Array.from(container.children).forEach((child, index) => {
        const rect = (child as HTMLElement).offsetTop + (child as HTMLElement).offsetHeight / 2;
        const distance = Math.abs(rect - containerCenter);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestIndex = index;
        }
      });
      setCurrentIndex(closestIndex);
    };

    const container = listRef.current;
    if (container) container.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  const updateStatus = (status: Student["status"]) => {
    if (!isStarted) setIsStarted(true);

    setStudents((prev) => {
      const updated = prev.map((s, i) => (i === currentIndex ? { ...s, status } : s));
      const nextIndex = currentIndex + 1 < updated.length ? currentIndex + 1 : currentIndex;
      setTimeout(() => scrollToStudent(nextIndex), 300);
      return updated;
    });
  };

  const allDone = students.every((s) => s.status !== "");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <div className="w-full h-10 bg-gray-200" />

      <main className="max-w-md w-full mx-auto p-4">
        <p className="text-sm font-bold text-gray-800 mb-3">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="bg-white rounded-xl p-3 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-sm font-semibold mb-2">
            <span>
              {students.filter((s) => s.status !== "").length}/{students.length}
            </span>
            <p className="text-lg font-bold mb-2">MPLB-2</p>

            <span className="text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </span>
          </div>

          <div className="relative h-72 overflow-hidden">
            <ul ref={listRef} className="overflow-y-auto scroll-smooth h-full pb-29 pt-31">
              {students.map((s, index) => (
                <li
                  key={s.id}
                  className={`flex justify-center items-center gap-2 px-3 py-2 mb-2 rounded-full transition-all duration-300 text-center ${index === currentIndex ? "font-bold text-gray-900" : s.status ? "text-gray-400" : "text-gray-300"}`}
                >
                  <span>{s.name}</span>
                  {s.status && (
                    <div
                      className={`w-5 h-5 flex items-center justify-center rounded-sm text-[10px] font-bold text-white ${
                        s.status === "H" ? "bg-green-600" : s.status === "S" ? "bg-yellow-400 text-gray-900" : s.status === "I" ? "bg-sky-400" : "bg-red-500"
                      }`}
                    >
                      {s.status}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none flex justify-center">
              <div className="w-[90%] h-10 border border-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="flex justify-around mt-4">
          <button onClick={() => updateStatus("H")} className="bg-green-600 w-14 h-14 rounded-md flex items-center justify-center">
            <Check className="text-white w-6 h-6" />
          </button>
          <button onClick={() => updateStatus("S")} className="bg-yellow-400 w-14 h-14 rounded-md flex items-center justify-center font-bold text-lg">
            S
          </button>
          <button onClick={() => updateStatus("I")} className="bg-sky-400 w-14 h-14 rounded-md flex items-center justify-center font-bold text-lg text-white">
            I
          </button>
          <button onClick={() => updateStatus("A")} className="bg-red-500 w-14 h-14 rounded-md flex items-center justify-center font-bold text-lg text-white">
            A
          </button>
        </div>

        <button disabled={!allDone} className={`w-full py-3 mt-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2 transition ${allDone ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}>
          <Check className="w-5 h-5" />
          Selesai
        </button>
      </main>
    </div>
  );
}
