import {ProductAccessGate} from "@/components/ProductAccessGate";
import {CalculatorShell} from "@/components/CalculatorShell";
import {ClinicalManualCalculator} from "@/components/ClinicalManualCalculator";
export default function Page(){return <ProductAccessGate active="doses"><CalculatorShell active="doses"><ClinicalManualCalculator mode="doses"/></CalculatorShell></ProductAccessGate>}
