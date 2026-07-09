"use client";

import { useState } from "react";
import { SkinSelector } from "@/components/skin/SkinSelector";
import type { Skin } from "@/lib/skin";

export function ProfileForm({ name, clinicalName, skinPreference }: { name: string; clinicalName: string; skinPreference: Skin }) {
  const [status, setStatus] = useState<string | null>(null);

  async function save(formData: FormData) {
    setStatus("Salvando...");
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        clinicalName: formData.get("clinicalName")
      })
    });
    setStatus(response.ok ? "Perfil atualizado." : "Não foi possível salvar.");
  }

  return (
    <div className="grid gap-6">
      <form action={save} className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-300">
          Nome
          <input name="name" defaultValue={name} className="h-12 rounded-md border border-cyan-300/15 bg-slate-900 px-3 text-white outline-none focus:border-cyan-300/60" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-300">
          Nome clínico/profissional
          <input name="clinicalName" defaultValue={clinicalName} className="h-12 rounded-md border border-cyan-300/15 bg-slate-900 px-3 text-white outline-none focus:border-cyan-300/60" />
        </label>
        <button className="h-11 rounded-md bg-cyan-300 text-sm font-black text-slate-950" type="submit">
          Salvar perfil
        </button>
        {status ? <p className="text-sm text-cyan-100">{status}</p> : null}
      </form>

      <section className="rounded-xl border border-cyan-300/10 bg-slate-950/60 p-4">
        <h2 className="text-lg font-black text-white">Skin da interface</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">Sua escolha sobrescreve a skin padrão definida pela administração.</p>
        <div className="mt-4">
          <SkinSelector
            currentSkin={skinPreference}
            onSave={async (skin) => {
              const response = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skinPreference: skin })
              });
              if (!response.ok) throw new Error("skin_not_saved");
            }}
          />
        </div>
      </section>
    </div>
  );
}
