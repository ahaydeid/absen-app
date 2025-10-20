"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

type OptionItem = { id: number | string; nama: string };
type DatabaseRow = { id: number | string; nama: string };
type SupabaseResponse = PostgrestSingleResponse<DatabaseRow[]>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FormSelect: React.FC<{
  id: string;
  label: string;
  options: OptionItem[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
}> = ({ id, label, options, value, onChange, disabled = false }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      <select id={id} value={value} onChange={onChange} className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-blue-500 focus:border-blue-500 transition duration-150" disabled={disabled} required>
        <option value="" disabled>
          -- Pilih {label} --
        </option>
        {options.map((opt) => (
          <option key={opt.id} value={String(opt.id)}>
            {opt.nama}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronDown className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  </div>
);

export default function ModalsRegisJadwal({ isOpen, onClose }: Props) {
  const [options, setOptions] = useState<{ [key: string]: OptionItem[] }>({
    hari: [],
    kelas: [],
    guru: [],
    mapel: [],
    jam: [],
    semester: [],
    jumlahJam: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    hari_id: "",
    kelas_id: "",
    guru_id: "",
    mapel_id: "",
    jam_id: "",
    semester_id: "",
    jumlah_jam_id: "",
  });

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const hariPromise = supabase.from("hari").select("id, nama").order("id");
        const kelasPromise = supabase.from("kelas").select("id, nama").order("nama");
        const guruPromise = supabase.from("guru").select("id, nama").order("nama");
        const mapelPromise = supabase.from("mapel").select("id, nama").order("nama");
        const jamPromise = supabase.from("jam").select("id, nama, mulai, selesai").order("id");
        const semesterPromise = supabase.from("semester").select("id, nama").order("id", { ascending: false });
        const jumlahJamPromise = supabase.from("jumlah_jam").select("id, nama").order("id");

        const [hariRes, kelasRes, guruRes, mapelRes, jamRes, semesterRes, jumlahJamRes] = await Promise.all([hariPromise, kelasPromise, guruPromise, mapelPromise, jamPromise, semesterPromise, jumlahJamPromise]);

        const mapResult = (res: SupabaseResponse) => {
          return (res.data || []).map((item) => ({
            id: item.id,
            nama: item.nama,
          })) as OptionItem[];
        };

        setOptions({
          hari: mapResult(hariRes),
          kelas: mapResult(kelasRes),
          guru: mapResult(guruRes),
          mapel: mapResult(mapelRes),
          jam: mapResult(jamRes),
          semester: mapResult(semesterRes),
          jumlahJam: mapResult(jumlahJamRes),
        });
      } catch (err: unknown) {
        console.error("Error fetching options:", err);
      } finally {
        setLoadingOptions(false);
      }
    };

    void fetchOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      kelas_id: Number(formData.kelas_id) || null,
      guru_id: Number(formData.guru_id) || null,
      mapel_id: Number(formData.mapel_id) || null,
      hari_id: Number(formData.hari_id) || null,
      jam_id: Number(formData.jam_id) || null,
      semester_id: Number(formData.semester_id) || null,
      jp: Number(formData.jumlah_jam_id) || null,
    };

    try {
      const { data, error: insertError } = await supabase.from("jadwal").insert([payload]).select();
      if (insertError) {
        throw insertError;
      }
      setFormData({
        hari_id: "",
        kelas_id: "",
        guru_id: "",
        mapel_id: "",
        jam_id: "",
        semester_id: "",
        jumlah_jam_id: "",
      });
      onClose();
      window.dispatchEvent(new CustomEvent("jadwal:created", { detail: data }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Insert jadwal error:", err);
      setError("Gagal membuat jadwal: " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isDisabled = loadingOptions || submitting;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto transform transition-all duration-300 scale-100 ease-out">
        <div className="sticky top-0 bg-white p-5 border-b flex items-center justify-between z-10">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">Buat Jadwal Baru</h3>
          <button onClick={onClose} aria-label="Tutup" className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {isDisabled && <div className="text-center py-4 text-sm text-gray-600">Memuat data pilihan...</div>}

          <div className="grid grid-cols-2 gap-4">
            <FormSelect id="hari_id" label="Nama Hari" options={options.hari} value={formData.hari_id} onChange={handleChange} disabled={isDisabled} />
            <FormSelect id="kelas_id" label="Nama Kelas" options={options.kelas} value={formData.kelas_id} onChange={handleChange} disabled={isDisabled} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormSelect id="guru_id" label="Nama Guru" options={options.guru} value={formData.guru_id} onChange={handleChange} disabled={isDisabled} />
            <FormSelect id="mapel_id" label="Nama Mata Pelajaran" options={options.mapel} value={formData.mapel_id} onChange={handleChange} disabled={isDisabled} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormSelect id="jam_id" label="Nama Jam (Sesi)" options={options.jam} value={formData.jam_id} onChange={handleChange} disabled={isDisabled} />
            <FormSelect id="semester_id" label="Semester" options={options.semester} value={formData.semester_id} onChange={handleChange} disabled={isDisabled} />
            <FormSelect id="jumlah_jam_id" label="Jumlah Jam" options={options.jumlahJam} value={formData.jumlah_jam_id} onChange={handleChange} disabled={isDisabled} />
          </div>

          {error && <div className="text-red-600 text-center">{error}</div>}

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 cursor-pointer py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-red-600 hover:text-white transition duration-150" disabled={isDisabled}>
              Batal
            </button>
            <button type="submit" className="px-6 py-2 rounded-lg text-white font-semibold bg-sky-600 hover:bg-sky-700 cursor-pointer transition duration-150" disabled={isDisabled}>
              {submitting ? "Menyimpan..." : "Buat Jadwal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
