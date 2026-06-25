"use client";

import { useEffect } from "react";
import type { FunnelStep } from "@/lib/funnel";

export function FunnelBeacon({ step, source, scope }: { step: FunnelStep; source?: string; scope?: string }) {
  useEffect(() => {
    const body = JSON.stringify({ step, source, scope });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/funnel", new Blob([body], { type: "application/json" }));
      return;
    }
    fetch("/api/funnel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true
    }).catch(() => undefined);
  }, [scope, source, step]);

  return null;
}
