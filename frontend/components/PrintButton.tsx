"use client";

import { FileDown, Printer } from "lucide-react";

export function PrintButton() {
  return (
    <div className="no-print flex w-full min-w-0 flex-wrap gap-2 sm:w-auto">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-cyan-400 px-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-cyan-300 sm:flex-none sm:px-4"
      >
        <Printer className="h-4 w-4" aria-hidden="true" />
        Imprimir
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md border border-slate-600 bg-slate-900 px-3 text-sm font-bold text-slate-100 transition hover:border-cyan-300 sm:flex-none sm:px-4"
      >
        <FileDown className="h-4 w-4" aria-hidden="true" />
        Exportar PDF
      </button>
    </div>
  );
}
