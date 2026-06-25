"use client";

import { useState, useTransition } from "react";

export function OrganizationCreateForm() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        const formData = new FormData(event.currentTarget);
        const payload = {
          name: String(formData.get("name") ?? ""),
          seatsPurchased: Number(formData.get("seatsPurchased") ?? 3)
        };

        startTransition(async () => {
          const response = await fetch("/api/organizations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await response.json();
          if (!response.ok) {
            setError(data.error ?? "Não foi possível criar a organização.");
            return;
          }
          window.location.href = "/organization";
        });
      }}
    >
      <label className="grid gap-2 text-sm font-semibold text-slate-300">
        Nome da organização
        <input className="h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60" name="name" required />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-300">
        Licenças contratadas
        <input className="h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-300/60" min={3} name="seatsPurchased" type="number" defaultValue={3} required />
      </label>
      {error ? <p className="text-sm font-semibold text-red-200">{error}</p> : null}
      <button className="h-12 rounded-md bg-cyan-300 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-70" disabled={isPending} type="submit">
        {isPending ? "Criando..." : "Criar organização"}
      </button>
    </form>
  );
}
