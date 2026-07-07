"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={`inline-flex h-9 items-center justify-center rounded-md border border-cyan-300/15 text-sm font-semibold text-slate-300 transition hover:text-white ${
        compact ? "w-14 px-2" : "px-3"
      }`}
    >
      Sair
    </button>
  );
}
