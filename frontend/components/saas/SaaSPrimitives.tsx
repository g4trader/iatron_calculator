import Link from "next/link";
import type { ReactNode } from "react";

export function SaaSPage({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.16),transparent_34rem),radial-gradient(circle_at_100%_20%,rgba(103,232,249,0.08),transparent_28rem)]" />
      <div className="relative">{children}</div>
    </main>
  );
}

export function Section({ id, eyebrow, title, children }: { id?: string; eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        {eyebrow ? <p className="mb-3 text-sm font-semibold text-cyan-200">{eyebrow}</p> : null}
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function PremiumButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <Link
      href={href}
      className={
        variant === "primary"
          ? "inline-flex h-12 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
          : "inline-flex h-12 items-center justify-center rounded-md border border-cyan-300/20 bg-white/[0.03] px-5 text-sm font-bold text-slate-100 transition hover:border-cyan-300/50"
      }
    >
      {children}
    </Link>
  );
}

export function NeuralCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-cyan-300/12 bg-slate-950/70 shadow-2xl shadow-black/20 backdrop-blur ${className}`}>
      {children}
    </div>
  );
}
