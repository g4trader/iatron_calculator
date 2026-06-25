"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { LockKeyhole } from "lucide-react";

export function TemporaryLoginForm({ callbackUrl = "/dashboard", enabled }: { callbackUrl?: string; enabled: boolean }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!enabled) {
    return (
      <div className="mt-8 rounded-md border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm font-semibold text-amber-100">
        Login temporário indisponível. Este acesso é permitido apenas em desenvolvimento.
      </div>
    );
  }

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
          const result = await signIn("temporary-credentials", {
            email,
            password,
            callbackUrl,
            redirect: false
          });

          if (result?.error) {
            setError("Email ou senha inválidos.");
            return;
          }

          window.location.href = result?.url ?? callbackUrl;
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
