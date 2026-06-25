"use client";

import { useState } from "react";

export function PortalButton({ ownerType = "USER", organizationId }: { ownerType?: "USER" | "ORGANIZATION"; organizationId?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function openPortal() {
    setIsLoading(true);
    const response = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerType, organizationId })
    });
    const data = await response.json();
    setIsLoading(false);
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? "Portal indisponível.");
  }

  return (
    <button
      type="button"
      onClick={openPortal}
      disabled={isLoading}
      className="inline-flex h-12 items-center justify-center rounded-md border border-cyan-300/20 bg-white/[0.03] px-5 text-sm font-bold text-slate-100 transition hover:border-cyan-300/50 disabled:opacity-60"
    >
      {isLoading ? "Abrindo..." : "Gerenciar assinatura"}
    </button>
  );
}
