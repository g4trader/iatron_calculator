import type { CalculationRequest, CalculationResponse, PcrCalculationResponse } from "@/types/calculations";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function calculateEmergency(payload: CalculationRequest): Promise<CalculationResponse> {
  const response = await fetch(`${API_URL}/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Não foi possível calcular. Verifique os campos e tente novamente.");
  }

  return response.json();
}

export async function calculatePcr(payload: CalculationRequest): Promise<PcrCalculationResponse> {
  const response = await fetch("/api/calculate/pcr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Não foi possível calcular a Folha PCR. Verifique os campos e tente novamente.");
  }

  return response.json();
}
