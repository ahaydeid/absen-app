"use client";

import { useRef, useState } from "react";
import { Check, ShieldAlert, Pill, XCircle } from "lucide-react";

interface Student {
  id: number;
  name: string;
  status: "" | "H" | "S" | "I" | "A";
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: "Raka Pratama", status: "H" },
    { id: 2, name: "Aldi Pratama", status: "H" },
    { id: 3, name: "Siti Nurhaliza", status: "H" },
    { id: 4, name: "Intan Permata Sari", status: "H" },
    { id: 5, name: "Rizky Maulana Akbar", status: "A" },
    { id: 6, name: "Dian Anggraini", status: "H" },
    { id: 7, name: "Bagas Aditya Putra", status: "H" },
    { id: 8, name: "Nadya Kusuma Putri", status: "" },
    { id: 9, name: "Fajar Ramadhan", status: "" },
    { id: 10, name: "Maya Salsabila Anjani", status: "" },
  ]);

  const [currentIndex, setCurrentIndex] = useState(7);
  const listRef = useRef<HTMLUListElement | null>(null);

  const scrollToStudent = (index: number) => {
    if (!listRef.current) return;
    const el = listRef.current.children[index] as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const updateStatus = (status: Student["status"]) => {
    setStudents((prev) => {
      const updated = prev.map((s, i) => (i === currentIndex ? { ...s, status } : s));
      const nextIndex = currentIndex + 1 < updated.length ? currentIndex + 1 : currentIndex;
      setCurrentIndex(nextIndex);
      setTimeout(() => scrollToStudent(nextIndex), 300);
      return updated;
    });
  };

  const allDone = students.every((s) => s.status !== "");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <div className="w-full h-10 bg-gray-200" />

      <main className="max-w-md w-full mx-auto p-4">
        <p className="text-sm font-bold mb-2">Senin, 12 September 2025</p>

        <div className="bg-white rounded-xl p-3 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-sm font-semibold mb-2">
            <span>{students.filter((s) => s.status !== "").length}/{students.length}</span>
            <span className="text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </span>
          </div>

          <div className="relative h-72 overflow-hidden">
            {/* Daftar siswa */}
            <ul ref={listRef} className="overflow-y-auto scroll-smooth h-full py-4">
              {students.map((s, index) => (
                <li
                  key={s.id}
                  className={`flex justify-between items-center px-3 py-2 mb-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "font-bold text-gray-900"
                      : s.status
                      ? "text-gray-400"
                      : "text-gray-300"
                  }`}
                >
                  <span>{s.name}</span>
                  {s.status === "H" && <Check className="text-green-600 w-4 h-4" />}
                  {s.status === "S" && <ShieldAlert className="text-yellow-500 w-4 h-4" />}
                  {s.status === "I" && <Pill className="text-sky-500 w-4 h-4" />}
                  {s.status === "A" && <XCircle className="text-red-500 w-4 h-4" />}
                </li>
              ))}
            </ul>

            {/* Kotak border tetap di tengah */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none flex justify-center">
              <div className="w-[90%] h-10 border border-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Tombol kontrol status */}
        <div className="flex justify-around mt-4">
          <button
            onClick={() => updateStatus("H")}
            className="bg-green-600 w-14 h-14 rounded-md flex items-center justify-center"
          >
            <Check className="text-white w-6 h-6" />
          </button>
          <button
            onClick={() => updateStatus("S")}
            className="bg-yellow-400 w-14 h-14 rounded-md flex items-center justify-center font-bold text-lg"
          >
            S
          </button>
          <button
            onClick={() => updateStatus("I")}
            className="bg-sky-400 w-14 h-14 rounded-md flex items-center justify-center font-bold text-lg text-white"
          >
            I
          </button>
          <button
            onClick={() => updateStatus("A")}
            className="bg-red-500 w-14 h-14 rounded-md flex items-center justify-center font-bold text-lg text-white"
          >
            A
          </button>
        </div>

        {/* Tombol selesai */}
        <button
          disabled={!allDone}
          className={`w-full py-3 mt-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2 transition ${
            allDone
              ? "bg-green-600 text-white"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          <Check className="w-5 h-5" />
          Selesai
        </button>
      </main>
    </div>
  );
}