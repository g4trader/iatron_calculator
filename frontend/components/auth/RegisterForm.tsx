"use client";

import Link from "next/link";
import { useState, useRef } from "react";

export function RegisterForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, setPending] = useState(false);
  const submitting = useRef(false);

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (submitting.current) return;
        const form = event.currentTarget;
        setError("");
        setSuccess("");
        const formData = new FormData(form);
        const payload = {
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? "")
        };

        submitting.current = true;
        setPending(true);
        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await response.json();
          if (!response.ok) {
            setError(data.error ?? "Não foi possível criar a conta.");
            return;
          }
          setSuccess(data.message ?? "Conta criada. Verifique seu email.");
          form.reset();
        } catch {
          setError("Não foi possível confirmar o cadastro. Verifique seu email antes de tentar novamente.");
        } finally {
          submitting.current = false;
          setPending(false);
        }
      }}
    >
      <label className="grid gap-2 text-sm font-semibold text-slate-300">
        Nome
        <input className="h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60" name="name" type="text" autoComplete="name" required disabled={isPending} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-300">
        Email
        <input className="h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60" name="email" type="email" autoComplete="email" required disabled={isPending} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-300">
        Senha
        <input className="h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60" name="password" type="password" autoComplete="new-password" minLength={10} required disabled={isPending} />
      </label>
      <p className="text-xs leading-5 text-slate-500">Use pelo menos 10 caracteres. O acesso será liberado após a verificação do email.</p>
      {error ? <p className="text-sm font-semibold text-red-200">{error}</p> : null}
      {success ? <p className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm font-semibold text-emerald-100">{success}</p> : null}
      <button className="h-12 rounded-md bg-cyan-300 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-70" disabled={isPending} type="submit">
        {isPending ? "Criando..." : "Criar conta"}
      </button>
      <Link href="/login" className="text-center text-sm font-semibold text-slate-300 hover:text-white">
        Já tenho conta
      </Link>
      <Link href="/resend-verification" className="text-center text-sm font-semibold text-slate-400 hover:text-white">
        Reenviar email de verificação
      </Link>
    </form>
  );
}
