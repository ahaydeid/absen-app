"use client";

import React, { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import DateDisplay from "@/app/components/DateDisplay";
import ConfirmSave from "@/components/ui/ConfirmSave";
import { supabase } from "@/lib/supabaseClient";

interface Student {
  id: number;
  name: string;
  status: "" | "H" | "S" | "I" | "A";
}

export default function AttendanceContent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // kelas name for header
  const [kelasName, setKelasName] = useState<string | null>(null);
  const [kelasNameLoading, setKelasNameLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [jadwalId, setJadwalId] = useState<number | null>(null);

  // State baru untuk menyimpan ID Kelas yang diambil dari Jadwal ID di URL
  const [kelasIdFromJadwal, setKelasIdFromJadwal] = useState<number | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const listRef = useRef<HTMLUListElement | null>(null);

  const scrollToStudent = (index: number) => {
    if (!listRef.current) return;
    const el = listRef.current.children[index] as HTMLElement | undefined;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const searchParams = useSearchParams();

  const initialJadwalId = (() => {
    // Nama variabel diubah secara internal untuk kejelasan
    const k = searchParams?.get("kelas");
    const n = k ? Number(k) : null;
    return k && !Number.isNaN(n) ? n : null;
  })();
  // selectedKelasId kini menyimpan nilai ID JADWAL dari parameter 'kelas'
  const [selectedJadwalId, setSelectedJadwalId] = useState<number | null>(initialJadwalId);
  const fetchCounterRef = useRef(0);

  // Perbaikan: Ganti `selectedKelasId` menjadi `selectedJadwalId` di logic awal
  useEffect(() => {
    const k = searchParams?.get("kelas");
    const newId = k ? Number(k) : null;

    if (k && Number.isNaN(newId)) {
      setSelectedJadwalId(null);
      return;
    }
    setSelectedJadwalId((prev) => (prev === newId ? prev : newId));
  }, [searchParams]);

  // Perbaikan: Logic untuk set Jadwal ID dan mengambil Kelas ID yang benar
  useEffect(() => {
    setJadwalId(null);
    setKelasIdFromJadwal(null);
    if (selectedJadwalId === null) return;

    // 1. Set Jadwal ID menggunakan nilai dari URL
    setJadwalId(selectedJadwalId);

    // 2. Cari ID Kelas yang benar berdasarkan ID Jadwal
    const loadKelasId = async () => {
      try {
        const { data, error } = await supabase.from("jadwal").select("kelas_id").eq("id", selectedJadwalId).maybeSingle();

        if (error) throw error;
        const kId = (data as { kelas_id: number } | null)?.kelas_id ?? null;
        setKelasIdFromJadwal(kId);
      } catch (err) {
        console.error("Gagal memuat Kelas ID dari Jadwal:", err);
        setKelasIdFromJadwal(null);
      }
    };

    void loadKelasId();
  }, [selectedJadwalId]); // FIX: Menambahkan selectedJadwalId sebagai dependency

  // Perbaikan: Fetch Siswa kini menggunakan Kelas ID yang benar (kelasIdFromJadwal)
  useEffect(() => {
    fetchCounterRef.current += 1;
    const fetchId = fetchCounterRef.current;

    const load = async () => {
      setLoading(true);
      setFetchError(null);
      setStudents([]);

      // Tunggu hingga kelasIdFromJadwal didapatkan
      if (kelasIdFromJadwal === null) {
        if (selectedJadwalId !== null) {
          // Menunggu ID Kelas dimuat, atau error jika ID Jadwal ada tapi ID Kelas gagal diambil
        }
        setLoading(false);
        return;
      }

      try {
        let query = supabase.from("siswa").select("id, nama, kelas_id").order("nama", { ascending: true });

        // Perbaikan: Gunakan kelasIdFromJadwal
        if (kelasIdFromJadwal !== null) {
          query = query.eq("kelas_id", kelasIdFromJadwal);
        }

        const res = await query;

        if (fetchId !== fetchCounterRef.current) return;

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
        if (fetchId !== fetchCounterRef.current) return;
        console.error("Failed to fetch siswa:", err);
        const message = err instanceof Error ? err.message : String(err);
        setFetchError(message || "Unknown error");
        setStudents([]);
      } finally {
        if (fetchId === fetchCounterRef.current) setLoading(false);
      }
    };

    void load();
  }, [kelasIdFromJadwal, selectedJadwalId]); // FIX: Menambahkan selectedJadwalId sebagai dependency

  // Perbaikan: Fetch Nama Kelas kini menggunakan Kelas ID yang benar
  useEffect(() => {
    const loadKelasName = async () => {
      setKelasName(null);
      // Perbaikan: Gunakan kelasIdFromJadwal
      if (kelasIdFromJadwal == null) return;

      setKelasNameLoading(true);
      try {
        // Perbaikan: Gunakan kelasIdFromJadwal
        const resp = await supabase.from("kelas").select("nama").eq("id", kelasIdFromJadwal).limit(1).maybeSingle();
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

    void loadKelasName();
  }, [kelasIdFromJadwal]); // Dependency diubah

  // Kode lama yang salah telah dihapus karena Jadwal ID sudah didapatkan dari URL
  // Hapus: useEffect(() => { ... loadJadwalId ... }, [selectedKelasId]);

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
    if (jadwalId === null) {
      // Tambahkan cek untuk memastikan Jadwal ID ada
      alert("Gagal menyimpan absensi: Jadwal tidak teridentifikasi.");
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
          jadwal_id: jadwalId, // Menggunakan Jadwal ID yang benar dari URL
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
        // Opsi: Redirect kembali ke TodayPage setelah berhasil
        const returnTo = searchParams?.get("returnTo") || `/today?id=${selectedJadwalId ?? ""}`;
        window.location.href = returnTo;
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
          <button onClick={() => updateStatus("H")} disabled={submitting} className="bg-green-600 w-19 h-15 rounded-md flex items-center justify-center active:bg-green-700 transition-colors duration-150">
            <Check className="text-white w-10 h-10" />
          </button>

          <button onClick={() => updateStatus("S")} disabled={submitting} className="bg-yellow-400 w-19 h-15 rounded-md flex items-center justify-center font-bold text-3xl active:bg-yellow-500 transition-colors duration-150">
            S
          </button>

          <button onClick={() => updateStatus("I")} disabled={submitting} className="bg-sky-400 w-19 h-15 rounded-md flex items-center justify-center font-bold text-3xl text-white active:bg-sky-500 transition-colors duration-150">
            I
          </button>

          <button onClick={() => updateStatus("A")} disabled={submitting} className="bg-red-500 w-19 h-15 rounded-md flex items-center justify-center font-bold text-3xl text-white active:bg-red-600 transition-colors duration-150">
            A
          </button>
        </div>

        <button
          // Tambahkan cek jadwalId
          disabled={!allDone || submitting || jadwalId === null}
          onClick={() => setConfirmOpen(true)}
          className={`w-full py-3 mt-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2 transition ${
            allDone && !submitting && jadwalId !== null ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          <Check className="w-5 h-5" />
          {submitting ? "Menyimpan..." : "Selesai"}
        </button>
      </main>

      <ConfirmSave
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await handleSubmit();
        }}
        title="Simpan Absen?"
        description="Pastikan semua status kehadiran siswa sudah benar. Lanjutkan menyimpan?"
      />
    </div>
  );
}
