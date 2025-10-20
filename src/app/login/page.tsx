"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
// Mengganti createBrowserSupabaseClient yang deprecated
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

// Asumsi: Anda menggunakan file ini sebagai default export dari /login/page.tsx
export default function LoginPageClient() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Menggunakan createPagesBrowserClient yang disarankan
  const supabase = createPagesBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Masukkan username dan password");
      return;
    }

    // Ambil hanya `error` untuk menghindari warning unused `data`
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });

    if (authErr) {
      // Menangani error spesifik Supabase
      if (authErr.message.includes("Invalid login credentials")) {
        setError("Email atau Password salah.");
      } else {
        setError(authErr.message ?? "Gagal login. Coba lagi.");
      }
      return;
    }

    // Redirect setelah login
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirect") ?? "/admin/account"; // Default redirect ke halaman admin
    router.push(redirectTo);
    router.refresh(); // Memaksa refresh untuk memuat data session baru
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <main className="w-full max-w-md px-4 sm:px-6 pt-12 pb-6">
        <header className="flex items-center gap-3 px-2 mb-8 justify-center">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white shadow-lg">
              {/* Asumsi: Anda memiliki file /logo.png di folder public */}
              <Image
                src="/logo.png"
                alt="SMK AL Badar logo"
                width={48}
                height={48}
                className="rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/48x48/6366f1/ffffff?text=L";
                }}
              />
            </div>

            <div className="leading-tight">
              <div className="text-lg font-semibold text-gray-900">Absen Siswa</div>
              <div className="text-xl font-extrabold text-sky-600">SMK AL Badar</div>
            </div>
          </div>
        </header>

        <section className="bg-white rounded-3xl shadow-xl border border-gray-100 mt-6 p-6 sm:p-8">
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-gray-800 mb-6">Masuk Akun</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="username"
                aria-label="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150"
                placeholder="email@sekolah.sch.id"
                type="email" // Menggunakan type email untuk validasi browser
                autoComplete="email" // Menggunakan email karena Supabase Auth menggunakan email
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                aria-label="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 pr-12 transition duration-150"
                placeholder="********"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 p-2 pt-4 text-gray-500 hover:text-sky-600 transition"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.046.165-2.05.471-3.002M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {error && <p className="text-sm text-center font-medium text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

            <div>
              <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold cursor-pointer rounded-full py-3 shadow-md shadow-sky-200 transition duration-200">
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
    </div>
  );
}
