"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {children}
      {!isAdmin && <BottomNav />}
    </>
  );
}
