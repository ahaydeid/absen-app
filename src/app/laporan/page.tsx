"use client";

import { useEffect, useState } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";

// === Tipe data ===
type Kelas = { id: number; nama: string };
type Siswa = { id: number; nama: string };
type StatusesByGroup = {
  hadir: number[];
  sakit: number[];
  izin: number[];
  alfa: number[];
  [key: string]: number[];
};
type Absen = { tanggal: string; statuses: StatusesByGroup | null; jadwal_id: number };

export default function ExportPage() {
  const supabase = createPagesBrowserClient();

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  // === Ambil daftar kelas yang diampu user (mirip halaman daftar kelas yang berfungsi) ===
  useEffect(() => {
    let mounted = true;

    const loadKelas = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      if (!session) {
        setKelasList([]);
        return;
      }

      const { data: acct } = await supabase.from("user_accounts").select("user_id, email").eq("auth_user_id", session.user.id).maybeSingle();

      let userAccount = acct ?? null;

      if (!userAccount && session.user.email) {
        const { data: byEmail } = await supabase.from("user_accounts").select("user_id, email").eq("email", session.user.email).maybeSingle();
        userAccount = byEmail ?? null;
      }

      const guruId = userAccount?.user_id ?? null;
      if (!guruId) {
        if (mounted) setKelasList([]);
        return;
      }

      const { data: jadwalData } = await supabase.from("jadwal").select("kelas_id, kelas:kelas_id(id,nama)").eq("guru_id", guruId).not("kelas_id", "is", null);

      if (!jadwalData) {
        setKelasList([]);
        return;
      }

      const kelasMap = new Map<number, string>();
      for (const j of jadwalData as { kelas?: { id?: number; nama?: string } }[]) {
        const id = j.kelas?.id;
        const nama = j.kelas?.nama;
        if (id && nama) kelasMap.set(id, nama);
      }

      if (mounted) {
        const kelasArray: Kelas[] = Array.from(kelasMap, ([id, nama]) => ({ id, nama }));
        setKelasList(kelasArray);
      }
    };

    void loadKelas();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  // === Helper format tanggal ===
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // === Fungsi utama: Export laporan ===
  const handleExport = async () => {
    if (!selectedKelas || !startDate || !endDate) {
      alert("Pilih kelas dan periode terlebih dahulu");
      return;
    }

    setLoading(true);

    try {
      const selectedClassName = kelasList.find((k) => k.id === selectedKelas)?.nama || `ID: ${selectedKelas}`;

      const { data: jadwalData } = await supabase.from("jadwal").select("id").eq("kelas_id", selectedKelas);
      const jadwalIds = jadwalData?.map((j) => j.id) || [];
      if (jadwalIds.length === 0) throw new Error("Tidak ada jadwal untuk kelas ini.");

      const { data: siswa } = (await supabase.from("siswa").select("id, nama").eq("kelas_id", selectedKelas).order("nama")) as { data: Siswa[] | null };

      const { data: absen } = (await supabase.from("absen").select("tanggal, statuses, jadwal_id").in("jadwal_id", jadwalIds).gte("tanggal", startDate).lte("tanggal", endDate)) as { data: Absen[] | null };

      const absenList = absen || [];
      const dailyAbsenMap = new Map<string, Record<number, string>>();

      for (const ab of absenList) {
        if (!ab.tanggal || !ab.statuses) continue;
        const tgl = ab.tanggal;
        if (!dailyAbsenMap.has(tgl)) dailyAbsenMap.set(tgl, {});
        const map = dailyAbsenMap.get(tgl)!;

        for (const groupKey in ab.statuses) {
          let statusChar: string;
          switch (groupKey) {
            case "hadir":
              statusChar = "H";
              break;
            case "sakit":
              statusChar = "S";
              break;
            case "izin":
              statusChar = "I";
              break;
            case "alfa":
              statusChar = "A";
              break;
            default:
              statusChar = "-";
          }

          const siswaIds = ab.statuses[groupKey];
          if (Array.isArray(siswaIds)) {
            siswaIds.forEach((sid) => (map[sid] = statusChar));
          }
        }
      }

      const templateBuffer = await (await fetch("/export/export-excell.xlsx")).arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateBuffer);
      const ws = workbook.getWorksheet(1);
      if (!ws) throw new Error("Worksheet tidak ditemukan.");

      ws.getCell("D5").value = selectedClassName;
      ws.getCell("J5").value = formatDate(startDate);
      ws.getCell("K5").value = formatDate(endDate);

      const tanggalList = Array.from(dailyAbsenMap.keys()).sort();
      tanggalList.forEach((tgl, idx) => {
        ws.getRow(7).getCell(9 + idx).value = formatDate(tgl);
      });

      const startRow = 8;
      (siswa || []).forEach((s, idx) => {
        const row = ws.getRow(startRow + idx);
        row.getCell("C").value = idx + 1;
        row.getCell("D").value = s.nama;

        let totalH = 0,
          totalS = 0,
          totalI = 0,
          totalA = 0;

        tanggalList.forEach((tgl, tIdx) => {
          const statuses = dailyAbsenMap.get(tgl);
          const status = statuses?.[s.id] || "-";
          const col = 9 + tIdx;
          row.getCell(col).value = status;

          if (status === "H") totalH++;
          if (status === "S") totalS++;
          if (status === "I") totalI++;
          if (status === "A") totalA++;
        });

        row.getCell("E").value = totalH;
        row.getCell("F").value = totalS;
        row.getCell("G").value = totalI;
        row.getCell("H").value = totalA;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Laporan_Absensi_${selectedClassName.replace(/\s/g, "_")}_${startDate}_${endDate}.xlsx`);
    } catch (err) {
      console.error("Kesalahan Export:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga.";
      alert(`Gagal melakukan export: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // === UI ===
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2 text-gray-800">
          <Download className="w-6 h-6 text-green-600" />
          Export Laporan Absensi
        </h1>

        <label className="block mb-2 font-semibold text-gray-700">Pilih Kelas:</label>
        <select
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 shadow-sm"
          value={selectedKelas ?? ""}
          onChange={(e) => setSelectedKelas(Number(e.target.value))}
          disabled={loading}
        >
          <option value="">-- Pilih Kelas --</option>
          {kelasList.map((k, index) => (
            <option key={`${k.id}-${index}`} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block mb-1 font-semibold text-gray-700">Dari:</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg py-3 px-1 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-semibold text-gray-700">Sampai:</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg py-3 px-1 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              disabled={loading}
            />
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={loading || !selectedKelas || !startDate || !endDate}
          className={`w-full font-bold text-lg rounded-xl py-3 mt-4 flex items-center justify-center gap-2 shadow-md transition duration-200 
          ${loading || !selectedKelas || !startDate || !endDate ? "bg-gray-400 text-gray-100 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white transform hover:scale-[1.01]"}`}
        >
          <Download className="w-5 h-5" />
          {loading ? "Memproses Data..." : "Export Laporan Excel"}
        </button>
      </div>
    </div>
  );
}
