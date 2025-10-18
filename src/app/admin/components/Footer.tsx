"use client";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 text-gray-600 text-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between">
        <p className="text-center sm:text-left">
          © {new Date().getFullYear()} <span className="font-semibold text-gray-800">Badar Edu</span>. Semua hak dilindungi.
        </p>

        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <a href="#" className="hover:text-sky-600 transition-colors">
            Kebijakan Privasi
          </a>
          <a href="https://wa.me/6283891495814" className="hover:text-sky-600 transition-colors">
            Bantuan
          </a>
        </div>
      </div>
    </footer>
  );
}
