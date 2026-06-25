"use client";

import { useState } from "react";

export function CheckoutButton({
  ownerType = "USER",
  planPriceId = "price_professional_monthly",
  organizationId,
  seats,
  children = "Iniciar trial"
}: {
  ownerType?: "USER" | "ORGANIZATION";
  planPriceId?: string;
  organizationId?: string;
  seats?: number;
  children?: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function startCheckout() {
    setIsLoading(true);
    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerType, planPriceId, organizationId, seats })
    });
    const data = await response.json();
    setIsLoading(false);
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? "Não foi possível iniciar o checkout.");
  }

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={startCheckout}
      className="inline-flex h-12 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
    >
      {isLoading ? "Abrindo checkout..." : children}
    </button>
  );
}
