"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { PlusCircle, Loader2, X, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Role = { id: number; nama: string };
type Guru = { id: number; nama: string };
type StatusType = "info" | "success" | "error";
type Status = { type: StatusType; text: string };

interface FormPayload {
  email: string;
  password: string;
  guru_id: number;
  role_id: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: FormPayload) => Promise<void> | void;
  isSubmitting?: boolean;
}

const StatusAlert: React.FC<{ status: Status }> = ({ status }) => {
  const baseClasses = "p-3 rounded-lg flex items-center space-x-3 text-sm font-medium";
  const colorMap: Record<StatusType, string> = {
    error: "bg-red-100 text-red-700",
    success: "bg-green-100 text-green-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <div className={`${baseClasses} ${colorMap[status.type]}`} role="alert">
      {status.text}
    </div>
  );
};

const FormInput: React.FC<{
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled: boolean;
  description?: string;
}> = ({ id, label, type = "text", value, onChange, placeholder, disabled, description }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
      placeholder={placeholder}
      disabled={disabled}
      required
      {...(type === "password" && { minLength: 6 })}
    />
    {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
  </div>
);

export default function ModalRegisAccount({ isOpen, onClose, onSubmit, isSubmitting: isSubmittingProp = false }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleId, setRoleId] = useState<number | "">("");

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Guru[]>([]);
  const [selectedGuru, setSelectedGuru] = useState<Guru | null>(null);

  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingGuru, setLoadingGuru] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  const [isInternalSubmitting, setIsInternalSubmitting] = useState(false);
  const isSubmitting = isSubmittingProp || isInternalSubmitting;
  const disabled = isSubmitting || loadingRoles || !supabase;

  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    setStatus(null);
    try {
      const { data, error } = await supabase.from("role").select("id,nama").order("nama");

      if (error) throw error;

      const fetchedRoles: Role[] = (data as Role[] | null) ?? [];
      setRoles(fetchedRoles);
      const def = fetchedRoles.find((r) => r.nama.toLowerCase() === "guru");
      setRoleId(def?.id ?? fetchedRoles[0]?.id ?? "");
    } catch (err: unknown) {
      console.error("Error loading roles:", err);
      setRoles([]);
      setStatus({ type: "error", text: "Gagal memuat daftar role." });
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setQuery("");
      setSuggestions([]);
      setSelectedGuru(null);
      setRoleId("");
      setStatus(null);
      setActiveIndex(-1);
      setIsInternalSubmitting(false);
      return;
    }
    fetchRoles();
  }, [isOpen, fetchRoles]);

  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();

    if (selectedGuru && q === selectedGuru.nama) {
      setSuggestions([]);
      setLoadingGuru(false);
      return;
    }

    if (q.length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      setLoadingGuru(false);
      return;
    }

    setLoadingGuru(true);
    const tid = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase.from("guru").select("id,nama").ilike("nama", `%${q}%`).order("nama").limit(10);

        if (error) throw error;
        setSuggestions((data as Guru[] | null) ?? []);
        setActiveIndex(-1);
      } catch (err: unknown) {
        console.error("Error searching guru:", err);
        setStatus({ type: "error", text: "Gagal mencari daftar guru." });
      } finally {
        setLoadingGuru(false);
      }
    }, 300);

    return () => window.clearTimeout(tid);
  }, [query, isOpen, selectedGuru]);

  const pickGuru = useCallback((g: Guru) => {
    setSelectedGuru(g);
    setQuery(g.nama);
    setSuggestions([]);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (suggestions.length === 0) return;

      const nav = (delta: number) => {
        e.preventDefault();
        setActiveIndex((i) => (i + delta + suggestions.length) % suggestions.length);
      };

      if (e.key === "ArrowDown") nav(1);
      else if (e.key === "ArrowUp") nav(-1);
      else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        pickGuru(suggestions[activeIndex]);
      } else if (e.key === "Escape") {
        setSuggestions([]);
        setActiveIndex(-1);
        e.currentTarget.blur();
      }
    },
    [suggestions, activeIndex, pickGuru]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

    if (!email.trim() || !password || !selectedGuru || roleId === "") {
      setStatus({ type: "error", text: "Mohon isi semua kolom dan pilih guru dari saran." });
      return;
    }
    if (password.length < 6) {
      setStatus({ type: "error", text: "Password minimal 6 karakter." });
      return;
    }

    setIsInternalSubmitting(true);
    setStatus({ type: "info", text: "Memproses..." });

    const payload: FormPayload = {
      email: email.trim(),
      password,
      guru_id: selectedGuru.id,
      role_id: Number(roleId),
    };

    try {
      if (onSubmit) {
        await onSubmit(payload);
        setStatus({ type: "success", text: `Permintaan registrasi untuk ${selectedGuru.nama} berhasil dikirim.` });
      } else {
        setStatus({ type: "error", text: "WARNING: Direct Supabase insert di client-side untuk password TIDAK AMAN. Gunakan API Route." });
        throw new Error("Penyimpanan password di client-side diblokir.");
      }
      window.setTimeout(() => onClose(), 900);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Submit error:", message);
      setStatus({ type: "error", text: message.includes("duplicate key") ? "Email sudah terdaftar." : "Gagal membuat akun." });
    } finally {
      setIsInternalSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto transform transition-all duration-300 scale-100 ease-out">
        <div className="sticky top-0 bg-white p-5 border-b flex items-center justify-between z-10">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            Pendaftaran Akun Baru
          </h3>
          <button onClick={onClose} disabled={isSubmitting} aria-label="Tutup" className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {status && <StatusAlert status={status} />}

          <div>
            <label htmlFor="guru-input" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Guru
            </label>
            <div role="combobox" aria-haspopup="listbox" aria-expanded={suggestions.length > 0} className="relative" aria-controls="guru-suggestions">
              <input
                id="guru-input"
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  const newQuery = e.target.value;
                  setQuery(newQuery);
                  if (selectedGuru && newQuery.trim() !== selectedGuru.nama) setSelectedGuru(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ketikkan nama..."
                className="w-full p-3 border border-gray-300 rounded-lg pr-10 focus:ring-blue-500 focus:border-blue-500"
                disabled={disabled}
                autoComplete="off"
                aria-autocomplete="list"
                aria-describedby={selectedGuru ? "guru-selection-status" : undefined}
                aria-activedescendant={activeIndex >= 0 ? `suggestion-${suggestions[activeIndex].id}` : undefined}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">{loadingGuru ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}</div>

              {suggestions.length > 0 && (
                <ul id="guru-suggestions" className="absolute z-20 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto" role="listbox">
                  {suggestions.map((g, idx) => (
                    <li
                      key={g.id}
                      id={`suggestion-${g.id}`}
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        pickGuru(g);
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`px-3 py-2 cursor-pointer transition duration-150 ease-in-out ${activeIndex === idx ? "bg-blue-600 text-white" : "hover:bg-gray-50"}`}
                      role="option"
                      aria-selected={activeIndex === idx}
                    >
                      {g.nama}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Role
            </label>
            <div className="relative">
              <select
                id="role-select"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-blue-500 focus:border-blue-500"
                disabled={disabled}
                required
              >
                <option value="" disabled>
                  -- Pilih Role --
                </option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">{loadingRoles ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}</div>
            </div>
          </div>

          <FormInput id="email-input" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" disabled={disabled} />

          <FormInput id="password-input" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" disabled={disabled} description="Password harus minimal 6 karakter." />

          <div>
            <button
              type="submit"
              disabled={disabled}
              className={`w-full flex items-center justify-center gap-2 py-3 cursor-pointer rounded-lg text-lg font-semibold transition duration-200 ${
                disabled ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
              {isSubmitting ? "Processing..." : "Daftarkan Akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
