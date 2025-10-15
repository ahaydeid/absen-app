"use client";

export default function Topbar({ title }: { title: string }) {
  return (
    <header className="h-14 bg-white fixed top-0 left-0 right-0 z-[-50] border-b border-gray-200 flex items-center justify-between px-4">
      <h2 className="font-semibold text-gray-700">{title}</h2>
      <div className="flex items-center gap-3">
        <h4>Ahadi, S.Kom</h4>
        <div className="w-9 h-9 rounded-full bg-gray-300"></div>
      </div>
    </header>
  );
}
