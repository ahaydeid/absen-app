"use client";

import BottomNav from "@/components/BottomNav";
import HeroSection from "@/app/components/HeroSection";
import MenuSection from "@/app/components/MenuSection";
import TodaySection from "./components/TodaySection";

export default function DashboardPage() {
  return (
    <div className="min-h-screen px-5 pb-15 pt-5 bg-[#F9F9F9]">
      <HeroSection/>
      <MenuSection/>
      <TodaySection/>




      <BottomNav
        active="home"
        onNavigate={(item) => {
          console.log("navigate to", item);
        }}
      />
    </div>
  );
}
