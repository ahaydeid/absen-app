// app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import ClientLayout from "@/components/ClientLayout";
import AuthSyncClient from "./(components)/AuthSyncClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Tambahkan konfigurasi Viewport
// Ini mengontrol perilaku tampilan di perangkat mobile dan tema warna OS.
export const viewport: Viewport = {
  themeColor: "#4F46E5", // Warna tema = Indigo 600
  initialScale: 1,
  width: "device-width",
  userScalable: false,
};

// 2. Update konfigurasi Metadata
export const metadata: Metadata = {
  title: "Badar Edu",
  description: "Aplikasi rekap absen siswa",

  // Tautkan ke file manifest PWA yang ada di folder public/
  manifest: "/manifest.json",

  // Tambahkan ikon untuk perangkat Apple dan ikon umum
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthSyncClient />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
