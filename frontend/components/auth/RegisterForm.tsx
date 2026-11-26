"use client";

import Link from "next/link";
import { useState, useRef } from "react";

export function RegisterForm({ mentory = false }: { mentory?: boolean } = {}) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [communityUrl, setCommunityUrl] = useState("");
  const [isPending, setPending] = useState(false);
  const submitting = useRef(false);

  return (
    <form
      className={mentory ? "mentory-register-form" : "mt-8 grid gap-4"}
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
          password: String(formData.get("password") ?? ""),
          ...(mentory ? { context: "mentory", whatsapp: (() => { const digits = String(formData.get("whatsapp") ?? "").replace(/\D/g, ""); return "+" + (digits.length <= 11 ? "55" : "") + digits; })(), termsAccepted: formData.has("terms"), privacyAcknowledged: formData.has("privacy"), marketingConsent: formData.has("marketing") } : {})
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
          setCommunityUrl(data.communityUrl ?? "");
          setSuccess(data.emailPending ? 'Conta criada! Entre na comunidade aberta. O envio da verificação falhou; use o link abaixo para solicitar outro e-mail.' : (mentory ? 'Conta criada! Entre na comunidade aberta e confirme seu e-mail para acessar a plataforma.' : data.message ?? 'Conta criada. Verifique seu email.'));
          form.reset();
        } catch {
          setError("Não foi possível confirmar o cadastro. Verifique seu email antes de tentar novamente.");
        } finally {
          submitting.current = false;
          setPending(false);
        }
      }}
    >
      <label className={mentory ? "mentory-register-field" : "grid gap-2 text-sm font-semibold text-slate-300"}>
        Nome
        <input className={mentory ? "mentory-register-input" : "h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60"} name="name" type="text" autoComplete="name" required disabled={isPending} />
      </label>
      <label className={mentory ? "mentory-register-field" : "grid gap-2 text-sm font-semibold text-slate-300"}>
        Email
        <input className={mentory ? "mentory-register-input" : "h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60"} name="email" type="email" autoComplete="email" required disabled={isPending} />
      </label>
      <label className={mentory ? "mentory-register-field" : "grid gap-2 text-sm font-semibold text-slate-300"}>
        Senha
        <input className={mentory ? "mentory-register-input" : "h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60"} name="password" type="password" autoComplete="new-password" minLength={10} required disabled={isPending} />
      </label>
      {mentory && <>
        <label className="mentory-register-field">WhatsApp com DDD<input className="mentory-register-input" name="whatsapp" type="tel" autoComplete="tel" required disabled={isPending}/></label>
        <label><input type="checkbox" name="terms" required disabled={isPending}/> Aceito os <Link href="/mentory/termos" target="_blank">termos de uso</Link>.</label>
        <label><input type="checkbox" name="privacy" required disabled={isPending}/> Li a <Link href="/mentory/privacidade" target="_blank">política de privacidade</Link>.</label>
        <label><input type="checkbox" name="marketing" disabled={isPending}/> Aceito receber comunicações comerciais (opcional).</label>
      </>}
      {communityUrl && <a className="mentory-register-submit" href={communityUrl} target="_blank" rel="noopener noreferrer">Entrar na comunidade aberta</a>}
      <p className={mentory ? "mentory-register-help" : "text-xs leading-5 text-slate-500"}>Use pelo menos 10 caracteres. Após confirmar o e-mail, siga para a próxima etapa do cadastro.</p>
      {error ? <p className={mentory ? "mentory-register-error" : "text-sm font-semibold text-red-200"}>{error}</p> : null}
      {success ? <p className={mentory ? "mentory-register-success" : "rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm font-semibold text-emerald-100"}>{success}</p> : null}
      <button className={mentory ? "mentory-register-submit" : "h-12 rounded-md bg-cyan-300 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-70"} disabled={isPending} type="submit">
        {isPending ? "Criando..." : "Criar conta"}
      </button>
      <Link href={mentory ? "/mentory/login" : "/login"} className={mentory ? "mentory-register-link" : "text-center text-sm font-semibold text-slate-300 hover:text-white"}>
        Já tenho conta
      </Link>
      <Link href="/resend-verification" className={mentory ? "mentory-register-link" : "text-center text-sm font-semibold text-slate-400 hover:text-white"}>
        Reenviar email de verificação
      </Link>
    </form>
  );
}
