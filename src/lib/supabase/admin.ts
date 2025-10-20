import { createClient } from "@supabase/supabase-js";

// Ambil variabel lingkungan rahasia
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // Peringatan yang jelas jika kunci hilang
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
}

/**
 * Membuat Supabase Client yang diinisialisasi dengan Service Role Key.
 * Klien ini memiliki akses administratif penuh dan melewati RLS.
 * HARUS DIGUNAKAN HANYA DI SERVER!
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
