"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Masukkan username dan password");
      return;
    }

    console.log({ username, password });
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">

      <main className="w-full max-w-md px-4 sm:px-6 mt-6">
        <header className="flex items-center gap-3 px-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center">
              <Image src="/logo.png" alt="SMK AL Badar logo" width={40} height={40} className="rounded-full object-cover" />
            </div>

            <div className="leading-tight">
              <div className="text-base font-semibold text-gray-900">Absen Siswa</div>
              <div className="text-base font-extrabold text-sky-600">SMK AL Badar</div>
            </div>
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow-md mt-6 p-5 sm:p-6">
          <h1 className="text-center text-xl font-extrabold tracking-wide mb-4">LOGIN</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-2">Username</label>
              <input
                aria-label="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder=""
                type="text"
                autoComplete="username"
              />
            </div>

            <div className="relative">
              <label className="block text-sm text-gray-500 mb-2">Password</label>
              <input
                aria-label="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-200 pr-12"
                placeholder=""
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute cursor-pointer right-3 top-13 transform -translate-y-1/2 p-2 rounded-md"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.046.165-2.05.471-3.002M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div>
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-600 text-white font-semibold cursor-pointer rounded-full py-3 shadow-sm transition"
              >
                Login
              </button>
            </div>
        
            <div className="text-sm italic text-gray-600"><Link href="https://ahadi.my.id">Lupa password?</Link></div>
          </form>
        </section>
      </main>

    </div>
  );
}
