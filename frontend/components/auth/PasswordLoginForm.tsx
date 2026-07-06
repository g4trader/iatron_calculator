"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { LockKeyhole } from "lucide-react";

function sameDomainDestination(resultUrl: string | null | undefined, fallbackUrl: string) {
  const rawUrl = resultUrl || fallbackUrl;
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackUrl || "/dashboard";
  }
}

export function PasswordLoginForm({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "");
        const password = String(formData.get("password") ?? "");

        startTransition(async () => {
          const result = await signIn("credentials", {
            email,
            password,
            callbackUrl,
            redirect: false
          });

          if (result?.error) {
            setError("Email ou senha inválidos. Confirme também se seu email já foi verificado.");
            return;
          }

          window.location.href = sameDomainDestination(result?.url, callbackUrl);
        });
      }}
    >
      <label className="grid gap-2 text-sm font-semibold text-slate-300">
        Email
        <input
          className="h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-300">
        Senha
        <input
          className="h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <div className="flex items-center justify-between gap-3 text-sm">
        <Link href="/register" className="font-semibold text-cyan-200 hover:text-cyan-100">
          Criar conta
        </Link>
        <Link href="/forgot-password" className="font-semibold text-slate-300 hover:text-white">
          Esqueci minha senha
        </Link>
      </div>
      <Link href="/resend-verification" className="text-sm font-semibold text-slate-300 hover:text-white">
        Reenviar verificação de email
      </Link>
      {error ? <p className="text-sm font-semibold text-red-200">{error}</p> : null}
      <button
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cyan-300 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
