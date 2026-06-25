"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        const formData = new FormData(event.currentTarget);
        const password = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        if (password !== confirmPassword) {
          setError("As senhas não conferem.");
          return;
        }

        startTransition(async () => {
          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password })
          });
          const data = await response.json();
          if (!response.ok) {
            setError(data.error ?? "Não foi possível redefinir a senha.");
            return;
          }
          setSuccess(data.message);
          event.currentTarget.reset();
        });
      }}
    >
      <label className="grid gap-2 text-sm font-semibold text-slate-300">
        Nova senha
        <input className="h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-300">
        Confirmar senha
        <input className="h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required />
      </label>
      {error ? <p className="text-sm font-semibold text-red-200">{error}</p> : null}
      {success ? <p className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm font-semibold text-emerald-100">{success}</p> : null}
      <button className="h-12 rounded-md bg-cyan-300 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-70" disabled={isPending || Boolean(success)} type="submit">
        {isPending ? "Redefinindo..." : "Redefinir senha"}
      </button>
      <Link href="/login" className="text-center text-sm font-semibold text-slate-300 hover:text-white">
        Voltar para login
      </Link>
    </form>
  );
}
