// app/login/page.tsx
"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

// Helper function untuk memastikan objek adalah Error
function isError(err: unknown): err is Error {
  return typeof err === "object" && err !== null && "message" in err;
}

export default function LoginPageClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => createPagesBrowserClient(), []);

  // tunggu session sampai timeout (opsional)
  async function waitForSession(timeoutMs = 5000, intervalMs = 200) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) return true;
      } catch {
        // abaikan, retry
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Masukkan email dan password.");
      return;
    }

    setLoading(true);

    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) {
        if (authErr.message?.includes("Invalid login credentials")) {
          setError("Email atau Password salah.");
        } else {
          setError(authErr.message ?? "Gagal login. Coba lagi.");
        }
        setLoading(false);
        return;
      }

      // biarkan spinner hidup — tunggu session sebentar (tidak wajib)
      await waitForSession(5000, 200);

      const params = new URLSearchParams(window.location.search);
      const redirectTo = (params.get("redirect") ?? "/admin/account").toString();

      // full navigation supaya halaman login ter-unload; spinner tetap terlihat
      window.location.replace(redirectTo);
      // jangan setLoading(false) di jalur sukses karena halaman akan unload
    } catch (err: unknown) {
      console.error("Login error:", err);
      // 🔥 PERBAIKAN: Menggunakan Type Guard untuk menangani tipe 'unknown'
      if (isError(err)) {
        setError(err.message ?? "Gagal login. Coba lagi.");
      } else {
        setError("Gagal login. Terjadi kesalahan yang tidak terduga.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <main className="w-full max-w-md px-4 sm:px-6 pt-12 pb-6">
        <header className="flex items-center gap-3 px-2 mb-8 justify-center">
          <div className="flex items-center gap-3">
            <div className="leading-tight">
              <div className="text-xl font-extrabold text-sky-600">Badar Edu</div>
              <div className="text-lg font-semibold text-gray-900">SMK Al Badar</div>
            </div>
          </div>
        </header>

        <section className="bg-white rounded-3xl shadow border border-gray-100 mt-6 p-6 sm:p-8">
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-gray-800 mb-6">Login</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150"
                placeholder="example@mail.id"
                type="email"
                autoComplete="email"
                disabled={loading} // Tambahkan disabled saat loading
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 pr-12 transition duration-150"
                placeholder="********"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                disabled={loading} // Tambahkan disabled saat loading
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 pt-8 text-gray-500 hover:text-sky-600 transition"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                disabled={loading} // Tambahkan disabled saat loading
              >
                {/* simple eye icon */}
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.046.165-2.05.471-3.002M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {error && <p className="text-sm text-center font-medium text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

            <div>
              <button type="submit" disabled={loading} className={`w-full ${loading ? "opacity-80 cursor-not-allowed" : "hover:bg-sky-700"} bg-sky-600 text-white font-bold rounded-full py-3 shadow-md transition duration-200`}>
                {/* Tidak ada perubahan tulisan/spinner di dalam tombol */}
                Login
              </button>
            </div>

            <div className="text-sm italic text-center text-gray-500">
              <Link href="https://ahadi.my.id" className="hover:text-sky-600 transition">
                Lupa password?
              </Link>
            </div>
          </form>
        </section>
      </main>

      {/* minimal spinner overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
      )}
    </div>
  );
}
