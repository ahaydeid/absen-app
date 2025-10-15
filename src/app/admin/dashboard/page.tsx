"use client";


export default function AdminDashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Selamat Datang, Admin</h3>
            <p className="text-sm text-gray-600">Ini adalah halaman utama dashboard admin. Gunakan menu di sebelah kiri untuk mengelola data sekolah.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
