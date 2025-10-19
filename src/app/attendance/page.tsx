import { Suspense } from "react";

import AttendanceContent from "./components/AttendanceContent";

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Memuat...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}
