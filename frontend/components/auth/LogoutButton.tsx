"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-md border border-cyan-300/15 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
    >
      Sair
    </button>
  );
}

