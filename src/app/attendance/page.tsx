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
  // selectedKelasId sekarang inisialisasinya kosong; akan diisi di useEffect dari window.location
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // kelas name for header
  const [kelasName, setKelasName] = useState<string | null>(null);
  const [kelasNameLoading, setKelasNameLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [jadwalId, setJadwalId] = useState<number | null>(null);

  const listRef = useRef<HTMLUListElement | null>(null);

  const scrollToStudent = (index: number) => {
    if (!listRef.current) return;
    const el = listRef.current.children[index] as HTMLElement;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const k = sp.get("kelas");
    if (k) {
      const n = Number(k);
      if (!Number.isNaN(n)) setSelectedKelasId(n);
    }
    // run only once on mount
  }, []);

  // Load siswa when selectedKelasId is set (or if null, load all)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      setStudents([]);

      try {
        let query = supabase.from("siswa").select("id, nama, kelas_id").order("nama", { ascending: true });

        if (selectedKelasId !== null) {
          query = query.eq("kelas_id", selectedKelasId);
        }

        const res = await query;
        const { data, error } = res;

        if (error) {
          console.error("Failed to fetch siswa:", error);
          setFetchError(error.message);
          setStudents([]);
        } else {
          const rows = (data ?? []) as Array<{ id: number; nama: string; kelas_id?: number }>;
          const mapped = rows.map((s) => ({
            id: s.id,
            name: s.nama,
            status: "" as Student["status"],
          }));
          setStudents(mapped);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch siswa:", err);
        const message = err instanceof Error ? err.message : String(err);
        setFetchError(message || "Unknown error");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedKelasId]);

  // Load kelas name if kelas selected
  useEffect(() => {
    const loadKelasName = async () => {
      setKelasName(null);
      if (selectedKelasId == null) return;

      setKelasNameLoading(true);
      try {
        const resp = await supabase.from("kelas").select("nama").eq("id", selectedKelasId).limit(1).maybeSingle();
        if (resp.error) {
          console.warn("Failed fetching kelas name:", resp.error);
          setKelasName(null);
        } else if (resp.data) {
          const d = resp.data as { nama?: string } | null;
          setKelasName(d?.nama ?? null);
        } else {
          setKelasName(null);
        }
      } catch (err) {
        console.error("Error loadKelasName:", err);
        setKelasName(null);
      } finally {
        setKelasNameLoading(false);
      }
    };

    loadKelasName();
  }, [selectedKelasId]);

  // Load jadwalId for selected kelas for today
  useEffect(() => {
    const loadJadwalId = async () => {
      setJadwalId(null);
      if (selectedKelasId == null) return;

      const jsDay = new Date().getDay();
      const hariCandidates = jsDay === 0 ? [0, 7] : [jsDay];

      try {
        const selectStr = "id, kelas_id, hari_id, jam_id";
        const resp = await supabase
          .from("jadwal")
          .select(selectStr)
          .in("hari_id", hariCandidates)
          .eq("kelas_id", selectedKelasId)
          .order("jam_id", { ascending: true })
          .limit(1);

        if (resp.error) {
          console.warn("Failed fetching jadwal for kelas:", resp.error);
          return;
        }

        const rows = (resp.data ?? []) as Array<{ id: number }>;
        if (rows.length > 0) setJadwalId(rows[0].id);
      } catch (err) {
        console.error("Error loadJadwalId:", err);
      }
    };

    loadJadwalId();
  }, [selectedKelasId]);

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
    handleScroll();

    return () => container?.removeEventListener("scroll", handleScroll);
  }, [students]);

  const updateStatus = (status: Student["status"]) => {
    if (submitting) return;

    setStudents((prev) => {
      const updated = prev.map((s, i) => (i === currentIndex ? { ...s, status } : s));
      const nextIndex = currentIndex + 1 < updated.length ? currentIndex + 1 : currentIndex;
      setTimeout(() => scrollToStudent(nextIndex), 200);
      return updated;
    });
  };

  const allDone = students.length > 0 && students.every((s) => s.status !== "");

  const mapStatusLetterToName = (letter: Student["status"]) => {
    switch (letter) {
      case "H":
        return "hadir";
      case "S":
        return "sakit";
      case "I":
        return "izin";
      case "A":
        return "alfa";
      default:
        return "hadir";
    }
  };

  const tanggal = new Date().toISOString().slice(0, 10);

  const handleSubmit = async () => {
    if (!students.length) return;
    if (!allDone) {
      alert("Tolong isi status semua siswa dulu.");
      return;
    }

    if (!jadwalId) {
      alert("Tidak menemukan jadwal untuk kelas ini hari ini. Tidak bisa menyimpan absensi.");
      return;
    }

    setSubmitting(true);

    try {
      const statuses: Record<string, number[]> = {};
      for (const s of students) {
        const name = mapStatusLetterToName(s.status || "H");
        if (!statuses[name]) statuses[name] = [];
        statuses[name].push(s.id);
      }

      const ensured = {
        hadir: statuses.hadir ?? [],
        izin: statuses.izin ?? [],
        sakit: statuses.sakit ?? [],
        alfa: statuses.alfa ?? [],
      };

      const { error } = await supabase.from("absen").upsert(
        {
          jadwal_id: jadwalId,
          tanggal,
          statuses: ensured,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "jadwal_id,tanggal" }
      );

      if (error) {
        console.error("Upsert absen gagal:", error);
        alert("Gagal menyimpan absensi: " + error.message);
      } else {
        alert("Absensi tersimpan.");
      }
    } catch (err: unknown) {
      console.error("Error submit:", err);
      alert("Terjadi error saat menyimpan.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayClassTitle = (() => {
    if (kelasNameLoading) return "Memuat kelas...";
    if (kelasName) return kelasName;
    if (selectedKelasId !== null) return `Kelas ${selectedKelasId}`;
    return "MPLB-1";
  })();

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
            {/* DYNAMIC kelas title */}
            <p className="text-lg font-bold mb-2">{displayClassTitle}</p>
            <span className="text-gray-400"> ... </span>
          </div>

          <div className="relative h-100 overflow-hidden">
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
                      index === currentIndex ? "font-bold text-white text-xl" : s.status ? "text-gray-400" : "text-gray-300"
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

            <div className="absolute inset-x-0 -translate-y-1/2 pointer-events-none flex justify-center z-0" style={{ top: "calc(50% - 10px)" }}>
              <div className="w-[100%] h-15 rounded" style={{ backgroundColor: "#000000" }} />
            </div>
          </div>
        </div>

        <div className="flex justify-around mt-4">
          <button onClick={() => updateStatus("H")} disabled={submitting} className="bg-green-600 w-14 h-14 rounded-md flex items-center justify-center active:bg-green-700 transition-colors duration-150">
            <Check className="text-white w-6 h-6" />
          </button>

          <button onClick={() => updateStatus("S")} disabled={submitting} className="bg-yellow-400 w-14 h-14 rounded-md flex items-center justify-center font-bold text-lg active:bg-yellow-500 transition-colors duration-150">
            S
          </button>

          <button onClick={() => updateStatus("I")} disabled={submitting} className="bg-sky-400 w-14 h-14 rounded-md flex items-center justify-center font-bold text-lg text-white active:bg-sky-500 transition-colors duration-150">
            I
          </button>

          <button onClick={() => updateStatus("A")} disabled={submitting} className="bg-red-500 w-14 h-14 rounded-md flex items-center justify-center font-bold text-lg text-white active:bg-red-600 transition-colors duration-150">
            A
          </button>
        </div>

        <button
          disabled={!allDone || submitting}
          onClick={handleSubmit}
          className={`w-full py-3 mt-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2 transition ${allDone && !submitting ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
        >
          <Check className="w-5 h-5" />
          {submitting ? "Menyimpan..." : "Selesai"}
        </button>
      </main>
    </div>
  );
}
