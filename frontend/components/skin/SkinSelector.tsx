"use client";

import { useState, useTransition } from "react";
import type { Skin } from "@/lib/skin";

const options: Array<{ value: Skin; label: string; description: string }> = [
  { value: "dark", label: "Escura", description: "Identidade atual do iatron.PED." },
  { value: "light", label: "Branca", description: "Experiência clara para leitura e campanhas." }
];

function applySkin(skin: Skin) {
  document.documentElement.dataset.skin = skin;
  document.body.dataset.skin = skin;
}

export function SkinSelector({
  currentSkin,
  onSave,
  compact = false
}: {
  currentSkin: Skin;
  onSave?: (skin: Skin) => Promise<void>;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<Skin>(currentSkin);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function chooseSkin(skin: Skin) {
    setSelected(skin);
    applySkin(skin);
    setMessage("Salvando preferência...");
    startTransition(async () => {
      try {
        if (onSave) {
          await onSave(skin);
        } else {
          const response = await fetch("/api/skin", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skin })
          });
          if (!response.ok) throw new Error("skin_not_saved");
        }
        setMessage("Skin atualizada.");
      } catch {
        setMessage("Não foi possível salvar a skin.");
      }
    });
  }

  return (
    <div className={compact ? "grid gap-2" : "grid gap-3"}>
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => chooseSkin(option.value)}
            disabled={isPending && selected === option.value}
            className={`rounded-lg border p-3 text-left transition ${
              selected === option.value
                ? "border-cyan-300/60 bg-cyan-300/15 text-white"
                : "border-cyan-300/10 bg-slate-950/65 text-slate-300 hover:border-cyan-300/35"
            }`}
          >
            <span className="block text-sm font-black">{option.label}</span>
            {!compact ? <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span> : null}
          </button>
        ))}
      </div>
      {message ? <p className="text-xs font-semibold text-cyan-100">{message}</p> : null}
    </div>
  );
}
