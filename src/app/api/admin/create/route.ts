import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
// Import Admin Client
import { supabaseAdmin } from "@/lib/supabase/admin"; 
import { PostgrestError } from "@supabase/supabase-js"; // Mengimpor tipe untuk error database

// --- Tipe Data untuk Pengecekan Peran ---
// Tipe untuk data peran yang mungkin berupa objek tunggal dari join
interface RoleObject { 
    nama: string | null; 
}

// Tipe untuk baris pengguna yang diambil dari user_accounts
interface UserRow {
    id: string;
    // Supabase often returns relational data as an object or sometimes an array of one object
    role: RoleObject | RoleObject[] | null; 
}

// --- Fungsi utilitas untuk Bypass Pengecekan Admin ---
function isAdminCheckEnabled(): boolean {
  return process.env.ADMIN_CHECK_ENABLED !== 'false';
}

// Helper untuk mendapatkan pesan error yang aman
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    // Jika error adalah PostgrestError (dari Supabase), ambil pesan spesifik
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return (error as { message: string }).message;
    }
    return "An unknown error occurred.";
};

export async function POST(req: NextRequest) {
    const { email, password, role_id, name } = await req.json();

    if (!email || !password || !role_id || !name) {
        return NextResponse.json({ error: "Missing required fields (email, password, role_id, name)." }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    let newUserAuthId: string | undefined; 

    try {
        // 1. VERIFIKASI PERAN (ROLE CHECK) dari pemanggil API
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized. User session not found." }, { status: 401 });
        }

        // Lakukan pengecekan peran admin, kecuali di-bypass
        if (isAdminCheckEnabled()) {
            const { data: roleCheckData, error: roleCheckError } = await supabase
                .from("user_accounts")
                .select("id, role:role_id (nama)")
                .eq("auth_user_id", session.user.id)
                .single();

            if (roleCheckError || !roleCheckData) {
                return NextResponse.json({ error: "Forbidden: Could not retrieve caller role." }, { status: 403 });
            }
            
            // Casting aman karena kita tahu struktur data yang dikembalikan oleh select().single()
            const userRow = roleCheckData as UserRow; 
            let roleName: string | undefined = undefined;
            const roleData = userRow.role ?? null;
            
            // Logika ekstraksi peran yang aman
            if (roleData) {
              if (Array.isArray(roleData) && roleData.length > 0) {
                  // Jika array, ambil elemen pertama dan cek null
                  roleName = roleData[0]?.nama ?? undefined; 
              } else if (typeof roleData === 'object' && roleData !== null) {
                  // Jika objek (dan bukan array), tegaskan sebagai RoleObject tunggal
                  const singleRole = roleData as RoleObject;
                  roleName = singleRole.nama ?? undefined;
              }
            }

            if (roleName !== "admin") {
                return NextResponse.json({ error: `Forbidden: Requires admin role. Found: ${roleName}` }, { status: 403 });
            }
        }

        // 2. BUAT AKUN DI SUPABASE AUTH (MENGGUNAKAN ADMIN CLIENT SEBENARNYA)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name },
        });

        if (authError) {
            console.error("Supabase Auth Admin Create Error:", authError);
            return NextResponse.json({ error: authError.message || "Failed to create user in Supabase Auth." }, { status: 400 });
        }
        
        if (!authData.user?.id) throw new Error("Failed to retrieve ID after creating user.");
        newUserAuthId = authData.user.id; 

        
        // 3. MASUKKAN DATA PROFIL KE user_accounts
        const { data: profileData, error: profileError } = await supabase
            .from("user_accounts")
            .insert({
                auth_user_id: newUserAuthId,
                email: email, 
                role_id: role_id,
                nama: name, 
            })
            .select('id')
            .single();

        if (profileError || !profileData) {
            console.error("User Account Insertion Failed:", profileError?.message);
            // PENTING: Jika insert gagal, hapus user yang baru dibuat (rollback)
            await supabaseAdmin.auth.admin.deleteUser(newUserAuthId);
            return NextResponse.json({ error: "Profile creation failed. Rolled back Auth user." }, { status: 500 });
        }

        return NextResponse.json({ message: "User created successfully.", user_id: profileData.id }, { status: 200 });

    } catch (error: unknown) { // Mengganti 'any' dengan 'unknown'
        // Penanganan Rollback
        if (newUserAuthId) {
             console.warn(`Attempting rollback for user ID: ${newUserAuthId}`);
             try {
                await supabaseAdmin.auth.admin.deleteUser(newUserAuthId);
             } catch (rollbackError) {
                console.error("Failed to rollback created user:", getErrorMessage(rollbackError));
             }
        }
        
        const errorMessage = getErrorMessage(error);
        console.error("Critical API Error:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
