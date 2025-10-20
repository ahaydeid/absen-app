import React from "react";
import Topbar from "@/app/admin/components/Topbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

type Props = { children: React.ReactNode };

export default function AdminLayout({ children }: Props) {
  return (
    <div className="flex bg-gray-50 h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title="Al Badar Edu" />
        <main className="flex-1 p-4 overflow-y-auto overflow-x-hidden">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
