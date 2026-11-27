import {ProductAccessGate} from "@/components/ProductAccessGate";
import {CalculatorShell} from "@/components/CalculatorShell";
import {ClinicalManualCalculator} from "@/components/ClinicalManualCalculator";
export default function Page(){return <ProductAccessGate active="fluids"><CalculatorShell active="fluids"><ClinicalManualCalculator mode="fluids"/></CalculatorShell></ProductAccessGate>}
