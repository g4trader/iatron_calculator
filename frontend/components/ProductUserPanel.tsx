"use client";

import Link from "next/link";
import { Settings, UserCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function ProductUserPanel({ mobile = false }: { mobile?: boolean }) {
  const { data: session } = useSession();
  const email = session?.user?.email ?? "Usuário logado";
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className={`rounded-xl border border-cyan-300/10 bg-slate-900/55 p-3 ${mobile ? "mt-3" : ""}`}>
      <Link
        href="/profile"
        className="flex min-w-0 items-center gap-3 rounded-lg transition hover:bg-cyan-300/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
        title="Acessar perfil"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan-300/15 bg-slate-950 text-cyan-100">
          <UserCircle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-100">{email}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{isAdmin ? "Administrador" : "Usuário"}</p>
        </div>
      </Link>

      <div className="mt-3 flex items-center gap-2">
        {isAdmin ? (
          <Link
            href="/admin"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/15 bg-slate-950 text-cyan-100 transition hover:border-cyan-300/40 hover:text-white"
            title="Acessar admin"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Acessar admin</span>
          </Link>
        ) : null}
        <LogoutButton compact={mobile ? false : true} />
      </div>
    </div>
  );
}
