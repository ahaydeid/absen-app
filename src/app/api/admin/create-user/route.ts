// app/api/admin/create-user/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CreateUserBody = {
  email: string;
  password: string;
  role_id: number;
  guru_id: number;
};

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET; // optional simple protection

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function mapPgErrorMessage(msg: string) {
  if (!msg) return "Server error";
  if (msg.includes("duplicate key")) return "Email sudah terdaftar.";
  if (msg.includes("violates foreign key constraint")) return "role_id atau guru_id tidak valid.";
  return msg;
}

export async function POST(request: Request) {
  try {
    // optional: check simple header-based admin secret
    if (ADMIN_SECRET) {
      const header = request.headers.get("x-admin-secret");
      if (header !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await request.json()) as CreateUserBody;
    const { email, password, role_id, guru_id } = body ?? ({} as CreateUserBody);

    if (!email || !password || !role_id || !guru_id) {
      return NextResponse.json({ error: "Field required: email, password, role_id, guru_id" }, { status: 400 });
    }

    // create auth user
    const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { guru_id, role_id },
      email_confirm: true,
    });

    if (createUserError) {
      console.error("createUserError:", createUserError);
      return NextResponse.json({ error: mapPgErrorMessage(createUserError.message) }, { status: 500 });
    }

    const userId = createUserData?.user?.id;
    if (!userId) {
      console.error("createUserData missing user id:", createUserData);
      return NextResponse.json({ error: "Gagal membuat user auth (user id kosong)" }, { status: 500 });
    }

    // insert into user_accounts
    const { data: insertedAccount, error: insertErr } = await supabaseAdmin
      .from("user_accounts")
      .insert([{ email, role_id, user_id: guru_id, auth_user_id: userId }])
      .select()
      .single();

    if (insertErr) {
      console.error("insert user_accounts error:", insertErr);
      // rollback auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.info("Rolled back auth user:", userId);
      } catch (delErr) {
        console.error("Failed to rollback auth user:", delErr);
      }
      return NextResponse.json({ error: mapPgErrorMessage(insertErr.message) }, { status: 500 });
    }

    return NextResponse.json({ ok: true, user: createUserData.user, account: insertedAccount }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Unhandled error in create-user route:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
