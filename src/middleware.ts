// src/middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isAuthCheckEnabled(): boolean {
  return process.env.AUTH_CHECK_ENABLED !== "false";
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // PUBLIC paths & prefixes that should NOT be redirected
  const PUBLIC_PREFIXES = [
    "/_next",
    "/static",
    "/api",
    "/icons", // allow /icons/*
    "/_next/static", // explicit
    "/_next/image",
  ];
  const PUBLIC_EXACT = ["/login", "/favicon.ico", "/manifest.json", "/sw.js", "/robots.txt", "/sitemap.xml"];

  // allow public exact paths
  if (PUBLIC_EXACT.includes(pathname)) return res;
  // allow public prefixes (exact match or startsWith)
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p))) return res;

  // if auth check disabled, still create client to hydrate session but don't enforce role routing
  if (!isAuthCheckEnabled()) {
    const supabase = createMiddlewareClient({ req, res });
    await supabase.auth.getSession();
    return res;
  }

  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // not authenticated -> redirect to login with original path as ?redirect=
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // authenticated -> fetch role from user_accounts
  let roleId: number | null = null;
  try {
    // try lookup by auth_user_id (recommended)
    const { data: acctByAuth, error: errAuth } = await supabase.from("user_accounts").select("role_id").eq("auth_user_id", session.user.id).maybeSingle();

    if (errAuth) {
      console.error("Middleware: error fetching user_accounts by auth_user_id:", errAuth);
    }

    if (acctByAuth?.role_id != null) {
      roleId = Number(acctByAuth.role_id);
    } else {
      // fallback: try lookup by email if auth_user_id not present or not found
      const userEmail = session.user.email;
      if (userEmail) {
        const { data: acctByEmail, error: errEmail } = await supabase.from("user_accounts").select("role_id").eq("email", userEmail).maybeSingle();

        if (errEmail) {
          console.error("Middleware: error fetching user_accounts by email:", errEmail);
        }

        if (acctByEmail?.role_id != null) {
          roleId = Number(acctByEmail.role_id);
        }
      }
    }
  } catch (err) {
    console.error("Middleware: unexpected error fetching role:", err);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // if we still don't know role, treat as unauthorized (redirect to /login)
  if (roleId === null) {
    console.warn("Middleware: role not found for user:", session.user.id);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // enforce role routing:
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  // 1) guru (role_id === 2): allowed only to non-admin pages (root and others excluding /admin)
  if (roleId === 2) {
    if (isAdminPath) {
      const target = new URL("/", req.url);
      return NextResponse.redirect(target);
    }
    return res;
  }

  // 2) admin (role_id === 1): allowed only to /admin and its descendants
  if (roleId === 1) {
    if (!isAdminPath) {
      const target = new URL("/admin", req.url);
      return NextResponse.redirect(target);
    }
    return res;
  }

  // default: deny/redirect to login if role not recognized
  console.warn("Middleware: unhandled role_id", roleId, "for user", session.user.id);
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // exclude public assets (manifest, sw, icons, _next, api, static, login, favicon)
  matcher: ["/((?!_next|api|static|login|favicon\\.ico|manifest\\.json|sw\\.js|icons).*)", "/"],
};
