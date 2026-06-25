"use client";

import { useState, useTransition } from "react";

export function OrganizationInviteForm({ organizationId }: { organizationId: string }) {
  const [error, setError] = useState("");
  const [acceptUrl, setAcceptUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setAcceptUrl("");
        const formData = new FormData(event.currentTarget);
        const payload = {
          email: String(formData.get("email") ?? ""),
          role: String(formData.get("role") ?? "MEMBER")
        };

        startTransition(async () => {
          const response = await fetch(`/api/organizations/${organizationId}/invites`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await response.json();
          if (!response.ok) {
            setError(data.error ?? "Não foi possível criar o convite.");
            return;
          }
          setAcceptUrl(data.acceptUrl);
          event.currentTarget.reset();
        });
      }}
    >
      <div className="grid gap-3 md:grid-cols-[1fr_150px]">
        <input className="h-11 rounded-md border border-cyan-300/15 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-300/60" name="email" placeholder="email@dominio.com" type="email" required />
        <select className="h-11 rounded-md border border-cyan-300/15 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-300/60" name="role" defaultValue="MEMBER">
          <option value="MEMBER">MEMBER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      {error ? <p className="text-sm font-semibold text-red-200">{error}</p> : null}
      {acceptUrl ? (
        <p className="break-all rounded-md border border-cyan-300/15 bg-cyan-300/[0.06] p-3 text-xs font-semibold text-cyan-100">
          Link de aceite: {acceptUrl}
        </p>
      ) : null}
      <button className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-70" disabled={isPending} type="submit">
        {isPending ? "Criando convite..." : "Criar convite"}
      </button>
    </form>
  );
}
