"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

export function ResendVerificationForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");
        setError("");
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const response = await fetch("/api/auth/resend-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: String(formData.get("email") ?? "") })
          });
          const data = await response.json();
          if (!response.ok) {
            setError(data.error ?? "Não foi possível reenviar agora.");
            return;
          }
          setMessage(data.message);
        });
      }}
    >
      <label className="grid gap-2 text-sm font-semibold text-slate-300">
        Email
        <input className="h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60" name="email" type="email" autoComplete="email" required />
      </label>
      {error ? <p className="text-sm font-semibold text-red-200">{error}</p> : null}
      {message ? <p className="rounded-md border border-cyan-300/15 bg-cyan-300/[0.06] p-3 text-sm font-semibold text-cyan-100">{message}</p> : null}
      <button className="h-12 rounded-md bg-cyan-300 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-70" disabled={isPending} type="submit">
        {isPending ? "Reenviando..." : "Reenviar verificação"}
      </button>
      <Link href="/login" className="text-center text-sm font-semibold text-slate-300 hover:text-white">
        Voltar para login
      </Link>
    </form>
  );
}
