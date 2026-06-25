"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type SurfaceProps = {
  children: ReactNode;
  className?: string;
};

export function ClinicalCard({ children, className = "" }: SurfaceProps) {
  return (
    <section className={`min-w-0 rounded-lg border border-cyan-300/15 bg-slate-950/78 shadow-2xl shadow-cyan-950/20 backdrop-blur ${className}`}>
      {children}
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string | number;
  tone?: "default" | "warning" | "danger";
  icon?: ReactNode;
};

export function MetricCard({ label, value, tone = "default", icon }: MetricCardProps) {
  const toneClass = {
    default: "border-cyan-300/15 bg-slate-950/70 text-cyan-100",
    warning: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    danger: "border-red-300/30 bg-red-400/10 text-red-100"
  }[tone];

  return (
    <ClinicalCard className={`metric-card p-4 ${toneClass}`}>
      <div className="flex items-center gap-2 text-current/80">
        {icon}
        <p className="text-xs font-semibold tracking-wide text-slate-400">{label}</p>
      </div>
      <p className="mt-3 break-words text-3xl font-black tracking-normal sm:text-4xl">{value}</p>
    </ClinicalCard>
  );
}

type SmartAccordionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: "default" | "warning";
};

export function SmartAccordion({ title, children, defaultOpen = false, tone = "default" }: SmartAccordionProps) {
  return (
    <details
      open={defaultOpen}
      className={`group rounded-lg border bg-slate-950/78 shadow-2xl shadow-cyan-950/20 backdrop-blur ${
        tone === "warning" ? "border-amber-300/35" : "border-cyan-300/15"
      }`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 transition hover:bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <span className={`h-2 w-8 rounded-full ${tone === "warning" ? "bg-amber-400" : "bg-cyan-300"}`} />
          <h2 className="text-sm font-semibold tracking-wide text-slate-100">{title}</h2>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

type NeuralInputProps = {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function NeuralInput({ label, error, className = "", ...props }: NeuralInputProps) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-300">
      <span>{label}</span>
      <input
        {...props}
        className={`h-14 w-full min-w-0 rounded-md border border-cyan-300/15 bg-slate-900/70 px-3 text-2xl font-black text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:bg-slate-950 focus:ring-2 focus:ring-cyan-300/15 ${className}`}
      />
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

type ButtonProps = {
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function CriticalActionButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 ${className}`}
    >
      {children}
    </button>
  );
}

export function AlertBanner({ children, className = "" }: SurfaceProps) {
  return (
    <div className={`rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm font-medium text-amber-100 ${className}`}>
      {children}
    </div>
  );
}

export function FloatingActionBar({ children }: SurfaceProps) {
  return (
    <div className="no-print fixed inset-x-3 bottom-3 z-20 rounded-lg border border-cyan-300/15 bg-slate-950/88 p-2 shadow-2xl shadow-black/40 backdrop-blur md:hidden">
      {children}
    </div>
  );
}

export const ResultPanel = ClinicalCard;
