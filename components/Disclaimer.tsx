"use client";

import { TriangleAlertIcon } from "lucide-react";

export function Disclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <p>
        <strong>Bukan nasihat hukum resmi.</strong> Pasalin adalah alat bantu
        informasi. Selalu rujuk teks peraturan resmi dan konsultasikan ke
        advokat atau LBH untuk keputusan penting.
      </p>
    </div>
  );
}
