"use client";
import React, { useState } from "react";
import ModalsRegisAccount from "@/app/admin/components/ModalsRegisAccount";
import { UserPlus, Search } from "lucide-react";

const UserAccountManagementPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // Fungsi fetch data user dan filter akan ditempatkan di sini
  // ...

  return (
    <div className="p-4 md:p-8">
      {/* HEADER DAN KONTROL */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center">
          Manajemen Akun Pengguna
        </h1>

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

        {/* Di sini Anda bisa menambahkan dropdown untuk filter Role */}
      </div>

      {/* DAFTAR AKUN (Tabel) */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 min-h-[400px]">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Daftar Pengguna Aktif</h2>
        {/* Placeholder untuk tabel daftar pengguna */}
        <div className="text-center p-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <p>Tabel daftar pengguna akan muncul di sini.</p>
          <p className="mt-2 text-sm">Gunakan kotak pencarian untuk memfilter data.</p>
        </div>
      </div>

      {/* MODAL PENDAFTARAN AKUN */}
      <ModalsRegisAccount isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default UserAccountManagementPage;
