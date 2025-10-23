"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import DateDisplay from "@/app/components/DateDisplay";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

type RelOneOrMany<T> = T | T[] | null;
type RawJadwal = {
  id: number;
  kelas_id?: number | null;
  mapel_id?: number | null;
  jam_id?: number | null;
  kelas?: RelOneOrMany<{ nama?: string }>;
  mapel?: RelOneOrMany<{ nama?: string }>;
  jam?: RelOneOrMany<{ nama?: string; mulai?: string; selesai?: string }>;
};

export default function TodayPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = rawId ? parseInt(rawId, 10) : undefined;

  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string | null>(null);
  const [jadwal, setJadwal] = useState<RawJadwal | null>(null);

  const [absenExists, setAbsenExists] = useState<boolean>(false);
  const [absenId, setAbsenId] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [keterangan, setKeterangan] = useState<string>("");
  const [prevNote, setPrevNote] = useState<string>("-");

  const [showConfirm, setShowConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);

  const nowWIB = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const todayISO = (() => {
    const now = nowWIB();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  const formatTime = (raw?: string) => {
    if (!raw) return "";
    const [hh = "0", mm = "0"] = raw.split(":");
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  const toMinutes = (time?: string) => {
    if (!time) return 0;
    const [h = "0", m = "0"] = time.split(":");
    return Number(h) * 60 + Number(m);
  };
  const computeJP = (mulai?: string, selesai?: string) => {
    if (!mulai || !selesai) return "1 JP";
    const durasi = toMinutes(selesai) - toMinutes(mulai);
    const jp = Math.max(1, Math.ceil(durasi / 45));
    return `${jp} JP`;
  };

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        setAbsenExists(false);
        setIsChecked(false);
        setAbsenId(null);

        const { data: jadwalData, error: jadwalErr } = await supabase.from("jadwal").select("id, kelas_id, mapel_id, jam_id, kelas:kelas_id(nama), mapel:mapel_id(nama), jam:jam_id(nama,mulai,selesai)").eq("id", id).maybeSingle();

        if (jadwalErr) throw jadwalErr;
        if (!jadwalData) {
          setError("Jadwal tidak ditemukan");
          return;
        }
        setJadwal(jadwalData as RawJadwal);

        const { data: absenRow, error: absenErr } = await supabase.from("absen").select("id, status_jadwal, keterangan").eq("jadwal_id", jadwalData.id).eq("tanggal", todayISO).maybeSingle();

        if (absenErr) throw absenErr;

        if (absenRow) {
          setAbsenExists(true);
          setAbsenId(absenRow.id);
          setIsChecked(Boolean(absenRow.status_jadwal));
          setKeterangan(absenRow.keterangan || "");
        } else {
          setAbsenExists(false);
          setKeterangan("");
        }

        const { data: prevAbsen, error: prevErr } = await supabase.from("absen").select("keterangan, tanggal").eq("jadwal_id", jadwalData.id).lt("tanggal", todayISO).order("tanggal", { ascending: false }).limit(1).maybeSingle();

        if (prevErr) throw prevErr;
        if (prevAbsen && prevAbsen.keterangan) {
          setPrevNote(prevAbsen.keterangan);
        } else {
          setPrevNote("-");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : JSON.stringify(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [id, todayISO]);

  const confirmComplete = async () => {
    if (!absenId) {
      setShowConfirm(false);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: updateErr } = await supabase.from("absen").update({ status_jadwal: true, keterangan }).eq("id", absenId);

      if (updateErr) throw updateErr;
      setIsChecked(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg);
    } finally {
      setProcessing(false);
      setShowConfirm(false);
    }
  };

  const card = (() => {
    if (!jadwal) return null;
    const jam = Array.isArray(jadwal.jam) ? jadwal.jam[0] : jadwal.jam;
    const kelas = Array.isArray(jadwal.kelas) ? jadwal.kelas[0] : jadwal.kelas;
    const mapel = Array.isArray(jadwal.mapel) ? jadwal.mapel[0] : jadwal.mapel;

    const mulai = jam?.mulai ?? "";
    const selesai = jam?.selesai ?? "";
    const code = jam?.nama ?? `J-${jadwal.id}`;
    const range = mulai && selesai ? `${formatTime(mulai)} - ${formatTime(selesai)}` : null;

    return {
      code,
      title: kelas?.nama ?? `Kelas ${jadwal.kelas_id ?? "-"}`,
      subject: mapel?.nama ?? "-",
      range,
      jp: computeJP(mulai, selesai),
      mulai,
      selesai,
    };
  })();

  const returnToPath = `/today?id=${id ?? ""}`;

  const isOverdue = (() => {
    if (!card?.selesai || isChecked) return false;
    const now = nowWIB();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return nowMinutes >= toMinutes(card.selesai);
  })();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pb-20">
      <div className="w-full max-w-md mt-3">
        <p className="text-sm md:text-lg font-bold text-gray-800 mb-2 text-center">
          <DateDisplay />
        </p>

        <div className="bg-gray-50 rounded-2xl shadow-sm border border-gray-200 p-3 mb-4">
          {loading ? (
            <div className="text-center text-gray-500 py-6">Memuat data jadwal...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-6">{error}</div>
          ) : card ? (
            <>
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-bold">{isOverdue ? <span className="bg-red-600 text-white rounded px-2 p-1">Kelas terlewat</span> : <span className="bg-sky-500 text-white rounded p-1 px-2">{card.code}</span>}</h2>

                <h3 className="text-3xl font-extrabold text-gray-900">{card.title}</h3>

                <div className="flex items-center gap-2">
                  {card.range && <span className="bg-yellow-400 text-black px-3 py-1.5 rounded-full text-lg">{card.range}</span>}
                  <span className="bg-gray-700 text-white font-semibold px-3 py-1.5 rounded-full text-lg">{card.jp}</span>
                </div>

                <div className="font-bold text-lg text-black">{card.subject}</div>

                <div className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="mb-1 text-gray-700 font-bold underline">Catatan sebelumnya:</div>
                  <div className="text-gray-900 whitespace-pre-wrap leading-tight text-justify">{prevNote}</div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {absenExists ? (
                  <div className="flex items-center p-2 gap-3">
                    <div className="w-[70%]">
                      <div className="text-gray-800 font-extrabold italic text-lg py-3 text-center">Sudah diabsen</div>
                    </div>
                    <div className="w-[30%]">
                      <Link href={`/attendance?kelas=${id}&returnTo=${encodeURIComponent(returnToPath)}`} className="block">
                        <span className="block bg-yellow-500 text-white font-extrabold text-lg rounded-sm py-3 shadow text-center">Ulangi</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <Link href={`/attendance?kelas=${id}&returnTo=${encodeURIComponent(returnToPath)}`} className="block">
                    <span className="block bg-sky-500 text-white font-extrabold text-lg rounded-xl py-3 text-center">Buka Absen</span>
                  </Link>
                )}

                <Link href="/poin" className="block">
                  <span className="block bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg rounded-xl py-3 text-center shadow">Tambah Nilai Harian</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-gray-600 text-center">Tidak ada jadwal</div>
          )}
          <div className="mt-3">
            <label className="block text-gray-700 font-semibold mb-1">Catatan:</label>
            <div className="bg-white p-1 border rounded">
              <textarea
                className={`w-full focus:outline-none ${isChecked ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "focus:ring-1 focus:ring-sky-400"}`}
                rows={3}
                placeholder="Tambahkan catatan kelas hari ini..."
                value={keterangan}
                onChange={(e) => {
                  if (e.target.value.length <= 150) setKeterangan(e.target.value);
                }}
                disabled={isChecked}
              />
              <div className="text-right text-xs text-gray-500 mt-[-8]">{keterangan.length}/150</div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          {isChecked ? (
            <div className="w-full bg-gray-100 text-center font-bold text-lg rounded-xl py-3 text-gray-800">Kelas sudah selesai</div>
          ) : (
            <>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!absenExists || processing}
                className={`w-full font-bold text-lg rounded-xl py-3 flex items-center justify-center gap-2 shadow ${!absenExists ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
              >
                <CheckCircle2 className="w-6 h-6" />
                {processing ? "Memproses..." : "Selesaikan Kelas"}
              </button>

              {!absenExists && <p className="mt-2 text-sm text-gray-400 italic text-center">Isi absen sebelum menyelesaikan kelas</p>}
            </>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(false)} />
          <div className="relative z-10 w-[90%] max-w-md bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg text-center font-bold mb-4">Selesaikan kelas?</h3>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-md border hover:bg-gray-50 text-sm" disabled={processing}>
                Batal
              </button>
              <button onClick={confirmComplete} className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-semibold disabled:opacity-50" disabled={processing}>
                {processing ? "Memproses..." : "Selesaikan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
