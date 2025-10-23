"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, ChevronDown, Trash2, Plus, Search } from "lucide-react"; // Import Search for autocomplete
import { supabase } from "@/lib/supabaseClient";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

type OptionItem = { id: number | string; nama: string };
type DatabaseRow = { id: number | string; nama: string };
type SupabaseResponse = PostgrestSingleResponse<DatabaseRow[]>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// -------------------------------------------------------------
// KOMPONEN BARU: FormAutocomplete (Menggantikan FormSelect)
// -------------------------------------------------------------
const FormAutocomplete: React.FC<{
  id: string;
  label?: string;
  options: OptionItem[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
}> = ({ id, label, options, value, onChange, disabled = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cari objek yang sedang dipilih saat ini untuk menampilkan di input
  const selectedOption = useMemo(() => options.find((opt) => String(opt.id) === value), [options, value]);

  // Filter opsi berdasarkan input pengguna
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((opt) => opt.nama.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  // Handle klik di luar komponen untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term jika ditutup
        if (selectedOption) {
          setSearchTerm(selectedOption.nama);
        } else {
          setSearchTerm("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedOption]);

  // Sinkronisasi input dengan value saat komponen dimuat atau value berubah
  useEffect(() => {
    if (selectedOption) {
      setSearchTerm(selectedOption.nama);
    } else {
      setSearchTerm("");
    }
  }, [selectedOption]);

  const handleSelect = (optionId: string) => {
    // Buat event dummy ChangeEvent untuk kompatibilitas dengan onChange handler lama
    const syntheticEvent = {
      target: {
        value: optionId,
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
    setIsOpen(false);
    // Sinkronkan input setelah memilih
    const selected = options.find((opt) => String(opt.id) === optionId);
    if (selected) {
      setSearchTerm(selected.nama);
    } else {
      setSearchTerm("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);

    // Jika input dikosongkan, kirim event value="" ke handler lama
    if (e.target.value === "") {
      const syntheticEvent = {
        target: {
          value: "",
        },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          placeholder="-- Pilih atau Cari --"
          className="w-full p-2 pl-10 border border-gray-300 rounded-lg pr-10 focus:ring-sky-500 focus:border-sky-500 transition duration-150 text-sm disabled:bg-gray-100"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <button
          type="button"
          onClick={() => setIsOpen((p) => !p)}
          disabled={disabled}
          className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
          aria-label="Toggle Dropdown"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`} />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => handleSelect(String(opt.id))}
                className={`p-2 cursor-pointer text-sm hover:bg-sky-100 transition duration-100 
                  ${String(opt.id) === value ? "bg-sky-50 font-semibold" : ""}`}
              >
                {opt.nama}
              </div>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">Tidak ada opsi ditemukan.</div>
          )}
        </div>
      )}
    </div>
  );
};
// -------------------------------------------------------------
// AKHIR KOMPONEN BARU
// -------------------------------------------------------------

export default function ModalBuatJadwalKelas({ isOpen, onClose }: Props) {
  const [options, setOptions] = useState<{ [key: string]: OptionItem[] }>({
    kelas: [],
    semester: [],
    hari: [],
    jam: [],
    mapel: [],
    guru: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  const [rows, setRows] = useState<{ hari_id: string; jam_id: string; mapel_id: string; guru_id: string }[]>([]);

  // Popups
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [alertPopup, setAlertPopup] = useState<{ visible: boolean; messages: string[] }>({
    visible: false,
    messages: [],
  });

  // Ambil data dropdown dari Supabase
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [kelasRes, semesterRes, hariRes, jamRes, mapelRes, guruRes] = await Promise.all([
          supabase.from("kelas").select("id, nama").order("nama"),
          supabase.from("semester").select("id, nama").order("id", { ascending: false }),
          supabase.from("hari").select("id, nama").order("id"),
          supabase.from("jam").select("id, nama, jp").order("id"),
          supabase.from("mapel").select("id, nama").order("nama"),
          supabase.from("guru").select("id, nama").order("nama"),
        ]);

        const mapResult = (res: SupabaseResponse) => (res.data || []).map((r) => ({ id: r.id, nama: r.nama })) as OptionItem[];

        setOptions({
          kelas: mapResult(kelasRes),
          semester: mapResult(semesterRes),
          hari: mapResult(hariRes),
          jam: mapResult(jamRes),
          mapel: mapResult(mapelRes),
          guru: mapResult(guruRes),
        });
      } catch (err) {
        console.error("Error fetching options:", err);
      } finally {
        setLoadingOptions(false);
      }
    };
    void fetchOptions();
  }, []);

  const addRow = () => setRows([...rows, { hari_id: "", jam_id: "", mapel_id: "", guru_id: "" }]);
  const removeRow = (index: number) => setRows(rows.filter((_, i) => i !== index));

  const handleRowChange = (index: number, field: keyof (typeof rows)[0], value: string) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const validateRows = () => {
    const incomplete: string[] = [];
    rows.forEach((row, i) => {
      const missing: string[] = [];
      if (!row.hari_id) missing.push("Hari");
      if (!row.jam_id) missing.push("Jam");
      if (!row.mapel_id) missing.push("Mapel");
      if (!row.guru_id) missing.push("Guru");
      if (missing.length > 0 && !(missing.length === 4)) {
        incomplete.push(`Baris ${i + 1}: ${missing.join(", ")} belum diisi.`);
      }
    });
    return incomplete;
  };

  // ... (Di dalam ModalBuatJadwalKelas) ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedKelas || !selectedSemester) {
      setError("Harap pilih Kelas dan Semester terlebih dahulu.");
      return;
    }

    const allEmpty = rows.every((r) => !r.hari_id && !r.jam_id && !r.mapel_id && !r.guru_id);
    const incomplete = validateRows();

    if (allEmpty) {
      setConfirmPopup(true);
      return;
    }

    if (incomplete.length > 0) {
      setAlertPopup({ visible: true, messages: incomplete });
      return;
    }

    setSubmitting(true);
    try {
      const { data: jamData, error: jamErr } = await supabase.from("jam").select("id, jp");
      if (jamErr) throw jamErr;

      const payloads = rows
        .filter((r) => r.hari_id && r.jam_id && r.mapel_id && r.guru_id)
        .map((r) => ({
          kelas_id: Number(selectedKelas),
          semester_id: Number(selectedSemester),
          hari_id: Number(r.hari_id),
          jam_id: Number(r.jam_id),
          mapel_id: Number(r.mapel_id),
          guru_id: Number(r.guru_id),
          jp: jamData?.find((j) => j.id === Number(r.jam_id))?.jp || null,
        }));

      // --- Cek Error Setelah Insert ---
      const { error: insertError } = await supabase.from("jadwal").insert(payloads).select();

      if (insertError) {
        if (insertError.code === "23505") {
          let errorMessage = "Terjadi duplikasi jadwal!";

          // Pesan Supabase (insertError.message) akan berisi nama constraint yang dilanggar
          if (insertError.message.includes("unique_jadwal_per_kelas")) {
            errorMessage = "Jadwal Ganda: Kelas ini sudah memiliki pelajaran yang dijadwalkan pada hari dan jam yang sama di semester ini.";
          } else if (insertError.message.includes("unique_jadwal_per_guru")) {
            errorMessage = "Bentrok Guru: Salah satu guru yang Anda pilih sudah memiliki jadwal mengajar di hari dan jam yang sama.";
          }

          // Lempar pesan error spesifik agar ditangkap di blok catch
          throw new Error(errorMessage);
        }

        // Lempar error jika bukan error duplikasi
        throw insertError;
      }

      // Jika berhasil tanpa error
      window.dispatchEvent(new CustomEvent("jadwal:created"));
      onClose();
    } catch (err: unknown) {
      console.error("Gagal Menyimpan Jadwal:", err);
      // Tampilkan pesan error spesifik ke pengguna
      const message = err instanceof Error ? err.message : "Gagal menyimpan jadwal karena masalah koneksi atau server.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSubmit = async () => {
    setConfirmPopup(false);

    if (rows.length === 0) {
      onClose();
      return;
    }

    const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
    await handleSubmit(fakeEvent);
  };

  if (!isOpen) return null;
  const disabled = loadingOptions || submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white p-5 border-b flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Buat Jadwal Kelas</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Kelas & Semester */}
          <div className="grid grid-cols-2 gap-4">
            {/* DIGANTI DARI FormSelect ke FormAutocomplete */}
            <FormAutocomplete id="kelas" label="Nama Kelas" options={options.kelas} value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} disabled={disabled} />
            <FormAutocomplete id="semester" label="Semester" options={options.semester} value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} disabled={disabled} />
          </div>

          {/* Daftar Jadwal */}
          <div className="space-y-4">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 border p-3 rounded-md bg-gray-50">
                {/* DIGANTI DARI FormSelect ke FormAutocomplete */}
                <FormAutocomplete id={`hari_${i}`} label="Nama Hari" options={options.hari} value={row.hari_id} onChange={(e) => handleRowChange(i, "hari_id", e.target.value)} disabled={!selectedKelas || !selectedSemester || disabled} />

                <FormAutocomplete id={`jam_${i}`} label="Nama Jam (Sesi)" options={options.jam} value={row.jam_id} onChange={(e) => handleRowChange(i, "jam_id", e.target.value)} disabled={!row.hari_id || disabled} />

                <FormAutocomplete id={`mapel_${i}`} label="Nama Mata Pelajaran" options={options.mapel} value={row.mapel_id} onChange={(e) => handleRowChange(i, "mapel_id", e.target.value)} disabled={!row.jam_id || disabled} />

                <FormAutocomplete id={`guru_${i}`} label="Nama Guru" options={options.guru} value={row.guru_id} onChange={(e) => handleRowChange(i, "guru_id", e.target.value)} disabled={!row.jam_id || disabled} />

                <div className="flex items-end justify-center">
                  <button type="button" onClick={() => removeRow(i)} className="p-2 h-10 border rounded-md bg-red-600 hover:bg-red-500 text-white flex justify-center items-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button type="button" onClick={addRow} className="flex items-center gap-2 text-sky-600 font-medium hover:text-sky-700">
              <Plus className="w-4 h-4" /> Tambah Baris Jadwal
            </button>
          </div>

          {error && <p className="text-center text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-red-600 hover:text-white transition" disabled={disabled}>
              Batal
            </button>
            <button type="submit" className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition" disabled={disabled}>
              {submitting ? "Menyimpan..." : "Buat Jadwal"}
            </button>
          </div>
        </form>
      </div>

      {/* Popup Konfirmasi */}
      {confirmPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            <p className="text-gray-700 mb-6 text-base">Buat Jadwal Ini?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setConfirmPopup(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                Batal
              </button>
              <button onClick={confirmSubmit} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
                Ya, buat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Alert */}
      {alertPopup.visible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h4 className="text-lg text-gray-600 mb-3">Input Belum Lengkap!</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm mb-4 space-y-1">
              {alertPopup.messages.map((msg, i) => (
                <li key={i} className="text-red-500 italic">
                  {msg}
                </li>
              ))}
            </ul>
            <div className="text-right">
              <button onClick={() => setAlertPopup({ visible: false, messages: [] })} className="px-5 py-2 bg-sky-600 text-white rounded hover:bg-sky-700">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
