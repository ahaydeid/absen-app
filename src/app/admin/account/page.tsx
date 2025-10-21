"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import ModalsRegisAccount from "@/app/admin/components/ModalsRegisAccount";
import { UserPlus, Search, Edit3, Trash2 } from "lucide-react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

// --- Tipe Data ---

type FormPayload = {
  email: string;
  password: string;
  guru_id: number;
  role_id: number;
};

// Gunakan tipe yang di-generate Supabase jika tersedia, untuk sementara gunakan ini:
type UserAccountRow = {
  auth_user_id: string | null;
  user_id: number | null;
  role_id: number | null;
  email: string | null;
};

type GuruRow = { id: number; nama: string | null };
type RoleRow = { id: number; nama: string | null };

type DisplayRow = {
  auth_user_id: string | null;
  user_id: number | null;
  role_id: number | null;
  email: string;
  guruName: string;
  roleName: string;
};

const UserAccountManagementPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<UserAccountRow[]>([]);
  const [gurusMap, setGurusMap] = useState<Map<number, string>>(new Map());
  const [rolesMap, setRolesMap] = useState<Map<number, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const supabase = createPagesBrowserClient();

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  // --- Fungsi Load Data yang Direfaktor ---
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Ambil semua user_accounts (FILTER role_id != 1 di sisi client)
      const { data: uaData, error: uaErr } = await supabase.from("user_accounts").select("auth_user_id, user_id, role_id, email");

      if (uaErr) throw uaErr;

      // Filter: HANYA tampilkan akun dengan role_id != 1 (Misalnya, role Admin utama)
      const filteredUsers = (uaData ?? []).filter((u) => u.role_id !== 1) as UserAccountRow[];
      setAccounts(filteredUsers);

      // Cek apakah ada data yang perlu diambil relasinya
      if (filteredUsers.length === 0) {
        setGurusMap(new Map());
        setRolesMap(new Map());
        return;
      }

      // Identifikasi ID unik
      const guruIds = Array.from(new Set(filteredUsers.map((u) => u.user_id).filter((x): x is number => typeof x === "number")));
      const roleIds = Array.from(new Set(filteredUsers.map((u) => u.role_id).filter((x): x is number => typeof x === "number")));

      // 2) Ambil data Guru dan Role secara paralel menggunakan Promise.all
      const [guruResp, roleResp] = await Promise.all([
        guruIds.length > 0 ? supabase.from("guru").select("id, nama").in("id", guruIds) : Promise.resolve({ data: [], error: null }),
        roleIds.length > 0 ? supabase.from("role").select("id, nama").in("id", roleIds) : Promise.resolve({ data: [], error: null }),
      ]);

      if (guruResp.error) throw guruResp.error;
      if (roleResp.error) throw roleResp.error;

      // Map Gurus
      const gm = new Map<number, string>();
      (guruResp.data ?? []).forEach((g: GuruRow) => gm.set(g.id, g.nama ?? "—"));
      setGurusMap(gm);

      // Map Roles
      const rm = new Map<number, string>();
      (roleResp.data ?? []).forEach((r: RoleRow) => rm.set(r.id, r.nama ?? "—"));
      setRolesMap(rm);
    } catch (err) {
      console.error("loadUsers error:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);
  // --- Akhir Fungsi Load Data yang Direfaktor ---

  useEffect(() => {
    // Dipanggil hanya saat komponen mounting
    void loadUsers();
  }, [loadUsers]);

  // create account: dipanggil dari modal. Setelah berhasil, reload list.
  const createAccount = useCallback(
    async (payload: FormPayload): Promise<void> => {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error ?? "Gagal membuat akun");
      }

      await loadUsers(); // Refresh list setelah berhasil
    },
    [loadUsers]
  );

  // delete handler: confirm, panggil API
  const handleDelete = useCallback(
    async (authUserId: string | null) => {
      if (!authUserId) return alert("Tidak dapat menghapus: identifier tidak tersedia.");

      // Konfirmasi penghapusan
      if (!confirm("Yakin ingin menghapus akun ini? Tindakan ini tidak bisa dibatalkan.")) return;

      try {
        // 1. Coba panggil API server-side
        const res = await fetch("/api/admin/delete-user", {
          // Ganti '#' dengan endpoint delete yang benar
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auth_user_id: authUserId }),
        });

        if (!res.ok) {
          // 2. Fallback: coba hapus langsung via supabase client jika API gagal
          console.warn("API delete-user failed, trying direct Supabase delete...");
          const { error: deleteError } = await supabase.from("user_accounts").delete().eq("auth_user_id", authUserId);
          if (deleteError) throw deleteError;
        }

        await loadUsers(); // Reload data setelah berhasil
      } catch (err) {
        console.error("delete error:", err);
        alert("Gagal menghapus akun: " + (err instanceof Error ? err.message : String(err)));
      }
    },
    [supabase, loadUsers]
  );

  // --- Derived Rows (Memoized) ---
  const displayed = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return accounts
      .map((a): DisplayRow => {
        const guruName = a.user_id ? gurusMap.get(a.user_id) ?? "—" : "—";
        const roleName = a.role_id ? rolesMap.get(a.role_id) ?? "—" : "—";
        return {
          auth_user_id: a.auth_user_id,
          user_id: a.user_id,
          role_id: a.role_id,
          email: a.email ?? "—",
          guruName,
          roleName,
        };
      })
      .filter((r) => {
        if (!q) return true;
        // Filter berdasarkan nama guru atau email
        return (r.guruName || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q);
      });
  }, [accounts, gurusMap, rolesMap, searchTerm]);
  // --- Akhir Derived Rows ---

  return (
    <div className="p-4 md:p-8">
      {/* HEADER DAN KONTROL */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center">Manajemen Akun Pengguna</h1>

        <button
          onClick={handleOpenModal}
          className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Tambah Akun Baru
        </button>
      </div>

      {/* SEARCH BAR DAN FILTER */}
      <div className="mb-8 flex space-x-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari berdasarkan Nama atau Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* DAFTAR AKUN (Tabel) */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 min-h-[400px]">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Daftar Pengguna Aktif ({displayed.length} Akun)</h2>

        {loading ? (
          <div className="text-center p-12 text-gray-500">Memuat data pengguna…</div>
        ) : error ? (
          <div className="text-center p-6 text-red-600">Error: {error}</div>
        ) : displayed.length === 0 && searchTerm === "" ? (
          <div className="text-center p-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <p>Tidak ada akun pengguna (selain Admin utama) yang ditemukan.</p>
            <p className="mt-2 text-sm">Coba tambahkan akun baru.</p>
          </div>
        ) : displayed.length === 0 && searchTerm !== "" ? (
          <div className="text-center p-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <p>Tidak ada hasil untuk pencarian &quot;{searchTerm}&quot;.</p>
            <p className="mt-2 text-sm">Coba kata kunci lain.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {displayed.map((row, idx) => (
                  <tr key={row.auth_user_id ?? idx} className={row.role_id === 1 ? "hidden" : ""}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.guruName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{row.roleName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{row.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit: navigasi ke halaman edit */}
                        {row.auth_user_id ? (
                          <Link href={`/admin/users/${encodeURIComponent(row.auth_user_id)}/edit`} className="p-2 rounded hover:bg-gray-100 bg-amber-300" aria-label="Edit akun">
                            <Edit3 className="w-4 h-4 text-black" />
                          </Link>
                        ) : (
                          <button disabled className="p-2 rounded opacity-50" aria-label="Edit akun">
                            <Edit3 className="w-4 h-4 text-gray-400" />
                          </button>
                        )}

                        {/* Delete */}
                        <button onClick={() => handleDelete(row.auth_user_id)} className="p-2 rounded hover:bg-gray-100 bg-red-500" aria-label="Hapus akun" title="Hapus akun">
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PENDAFTARAN AKUN */}
      <ModalsRegisAccount isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={createAccount} />
    </div>
  );
};

export default UserAccountManagementPage;
