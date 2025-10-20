"use client";

import { useEffect } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export default function AuthSyncClient() {
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, session }),
        });
      } catch (err) {
        console.error("Auth sync failed:", err);
      }
    });

    return () => {
      sub?.subscription?.unsubscribe?.();
    };
  }, [supabase]);

  return null;
}
