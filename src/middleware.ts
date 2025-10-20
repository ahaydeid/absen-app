import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isAuthCheckEnabled(): boolean {
  return process.env.AUTH_CHECK_ENABLED !== "false";
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  const PUBLIC_PREFIXES = ["/_next", "/static", "/api"];
  const PUBLIC_EXACT = ["/login", "/favicon.ico"];

  if (PUBLIC_EXACT.includes(pathname)) return res;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return res;

  if (!isAuthCheckEnabled()) {
    const supabase = createMiddlewareClient({ req, res });
    await supabase.auth.getSession();
    return res;
  }

  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (pathname === "/") {
    if (session) return NextResponse.redirect(new URL("/attendance", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next|api|static|login|favicon\\.ico).*)", "/"],
};
