import React from "react";
import Topbar from "@/app/admin/components/Topbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />


      <div className="flex flex-col flex-1 min-h-screen">
        <Topbar title="Al Badar Edu" />
        <main className="flex-1 p-4 overflow-y-auto">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
