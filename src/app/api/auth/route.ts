// app/api/auth/route.ts
import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, session } = body ?? {};

    // create a response we can attach cookies to
    const res = NextResponse.json({ ok: true });

    // create a supabase server client bound to this req/res so we can set cookies
    // (createMiddlewareClient works in edge/route handlers)
    const supabase = createMiddlewareClient({ req: req as unknown as NextRequest, res });

    if (event === "SIGNED_IN" && session) {
      // set session cookie on response (so middleware can read it next request)
      // supabase.auth.setSession expects an object with access_token / refresh_token
      // Passing entire session object is OK for many helper implementations
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    } else if (event === "SIGNED_OUT") {
      // clear session cookies server-side
      await supabase.auth.signOut();
    } else if (session) {
      // handle other events (e.g., token refresh) by setting session too
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }

    return res;
  } catch (err) {
    console.error("Error in /api/auth:", err);
    return NextResponse.json({ error: "auth sync failed" }, { status: 500 });
  }
}
