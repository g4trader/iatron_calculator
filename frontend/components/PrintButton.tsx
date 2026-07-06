"use client";

import { FileDown, Printer } from "lucide-react";

export function PrintButton({ iconOnlyMobile = false }: { iconOnlyMobile?: boolean }) {
  return (
    <div className="no-print flex w-full min-w-0 flex-wrap gap-2 sm:w-auto">
      <button
        type="button"
        onClick={() => window.print()}
        className={`inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-cyan-400 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-cyan-300 sm:flex-none ${
          iconOnlyMobile ? "w-10 flex-none px-0 sm:w-auto sm:px-4" : "px-3 sm:px-4"
        }`}
        title="Imprimir"
      >
        <Printer className="h-4 w-4" aria-hidden="true" />
        <span className={iconOnlyMobile ? "sr-only sm:not-sr-only" : ""}>Imprimir</span>
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className={`inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md border border-slate-600 bg-slate-900 text-sm font-bold text-slate-100 transition hover:border-cyan-300 sm:flex-none ${
          iconOnlyMobile ? "w-10 flex-none px-0 sm:w-auto sm:px-4" : "px-3 sm:px-4"
        }`}
        title="Exportar PDF"
      >
        <FileDown className="h-4 w-4" aria-hidden="true" />
        <span className={iconOnlyMobile ? "sr-only sm:not-sr-only" : ""}>Exportar PDF</span>
      </button>
    </div>
  );
}
