import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  tone?: "default" | "alert";
};

export function ResultSection({ title, children, tone = "default" }: Props) {
  return (
    <section
      className={`print-break-inside-avoid rounded-lg border bg-slate-950/78 p-4 shadow-2xl shadow-cyan-950/20 backdrop-blur ${
        tone === "alert" ? "border-amber-300/35 ring-1 ring-amber-300/10" : "border-cyan-300/15"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-8 rounded-full ${tone === "alert" ? "bg-amber-500" : "bg-cyan-500"}`} />
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-100">{title}</h2>
      </div>
      {children}
    </section>
  );
}
