"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

export default function ProtectedClientGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session: Session | null = data?.session ?? null;

        if (!mounted) return;

        if (!session) {
          // not logged in -> redirect to login preserving path
          router.replace(`/app/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
      } catch (err: unknown) {
        console.error("ProtectedClientGuard error:", err);
        router.replace(`/app/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Memeriksa sesi...</div>;
  }

  return <>{children}</>;
}
