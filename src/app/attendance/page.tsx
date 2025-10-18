"use client";

import { useRef, useState, useEffect } from "react";
import { Check } from "lucide-react";
import DateDisplay from "@/components/DateDisplay";
import { supabase } from "@/lib/supabaseClient";

interface Student {
  id: number;
  name: string;
  status: "" | "H" | "S" | "I" | "A";
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const listRef = useRef<HTMLUListElement | null>(null);

  const scrollToStudent = (index: number) => {
    if (!listRef.current) return;
    const el = listRef.current.children[index] as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // fetch siswa from supabase
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFetchError(null);

      const { data, error } = await supabase.from<"siswa", { id: number; nama: string }>("siswa").select("id, nama").order("nama", { ascending: true });

      if (error) {
        console.error("Failed to fetch siswa:", error);
        setFetchError(error.message);
        setStudents([]);
      } else {
        // map to our Student type, default status ""
        const mapped = (data || []).map((s) => ({
          id: s.id,
          name: s.nama,
          status: "" as Student["status"],
        }));
        setStudents(mapped);
      }

      setLoading(false);
    };

    load();
  }, []);

  // detect visible / center item
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return;
      const container = listRef.current;
      const containerCenter = container.scrollTop + container.clientHeight / 2;
      let closestIndex = 0;
      let smallestDistance = Infinity;

      Array.from(container.children).forEach((child, index) => {
        const childEl = child as HTMLElement;
        const rectCenter = childEl.offsetTop + childEl.offsetHeight / 2;
        const distance = Math.abs(rectCenter - containerCenter);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestIndex = index;
        }
      });

      setCurrentIndex(closestIndex);
    };

    const container = listRef.current;
    if (container) container.addEventListener("scroll", handleScroll);
    // also call once to set initial index
    handleScroll();

    return () => container?.removeEventListener("scroll", handleScroll);
  }, [students]);

  const updateStatus = (status: Student["status"]) => {
    if (!isStarted) setIsStarted(true);

    setStudents((prev) => {
      const updated = prev.map((s, i) => (i === currentIndex ? { ...s, status } : s));
      const nextIndex = currentIndex + 1 < updated.length ? currentIndex + 1 : currentIndex;
      setTimeout(() => scrollToStudent(nextIndex), 200);
      return updated;
    });
  };

  const allDone = students.length > 0 && students.every((s) => s.status !== "");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <main className="max-w-md w-full mx-auto p-4">
        <p className="text-xs sm:text-sm md:text-lg font-bold text-gray-800 mb-2 md:mb-3 text-center flex-1">
          <DateDisplay />
        </p>

        <div className="bg-white rounded-xl p-3 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-sm font-semibold mb-2">
            <span>
              {students.filter((s) => s.status !== "").length}/{students.length}
            </span>
            <p className="text-lg font-bold mb-2">MPLB-1</p>
            <span className="text-gray-400"> ... </span>
          </div>

          <div className="relative h-100 overflow-hidden">
            {/* pastikan UL punya z-index lebih tinggi dari overlay */}
            <ul ref={listRef} className="relative z-10 overflow-y-auto scroll-smooth h-96 pb-43 pt-43">
              {loading ? (
                <li className="text-center py-2 text-white">Memuat daftar siswa...</li>
              ) : fetchError ? (
                <li className="text-center py-2 text-red-500">Error: {fetchError}</li>
              ) : students.length === 0 ? (
                <li className="text-center py-2 text-white italic">Tidak ada siswa</li>
              ) : (
                students.map((s, index) => (
                  <li
                    key={s.id}
                    className={`flex justify-center items-center gap-2 px-3 py-2 mb-2 rounded-full transition-all duration-300 text-center ${
                      index === currentIndex
                        ? "font-bold text-white text-xl"
                        : s.status
                        ? "text-gray-400"
                        : "text-gray-300"
                    }`}
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
                ))
              )}
            </ul>

            {/* overlay pill: letakkan di bawah (z-0) agar list items bisa di atasnya */}
            <div className="absolute inset-x-0 -translate-y-1/2 pointer-events-none flex justify-center z-0" style={{ top: "calc(50% - 10px)" }}>
              <div
                className="w-[100%] h-15 rounded"
                style={{ backgroundColor: "#000000" }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-around mt-4">
          <button onClick={() => updateStatus("H")} className="bg-green-600 w-14 h-14 rounded-md flex items-center justify-center active:bg-green-700 transition-colors duration-150">
            <Check className="text-white w-6 h-6" />
          </button>

          <button onClick={() => updateStatus("S")} className="bg-yellow-400 w-14 h-14 rounded-md flex items-center justify-center font-bold text-lg active:bg-yellow-500 transition-colors duration-150">
            S
          </button>

          <button onClick={() => updateStatus("I")} className="bg-sky-400 w-14 h-14 rounded-md flex items-center justify-center font-bold text-lg text-white active:bg-sky-500 transition-colors duration-150">
            I
          </button>

          <button onClick={() => updateStatus("A")} className="bg-red-500 w-14 h-14 rounded-md flex items-center justify-center font-bold text-lg text-white active:bg-red-600 transition-colors duration-150">
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
