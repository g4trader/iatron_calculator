import type { ReactNode } from "react";
import { CalculatorShell } from "@/components/CalculatorShell";
import "./resources.css";

export function ResourceFrame({ kind, children }: { kind: "library" | "infusion"; children: ReactNode }) {
  return <CalculatorShell active={kind}><div className="clinical-resources">{children}</div></CalculatorShell>;
}
