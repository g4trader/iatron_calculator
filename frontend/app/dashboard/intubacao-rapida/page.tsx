import {ProductAccessGate} from "@/components/ProductAccessGate";
import {CalculatorShell} from "@/components/CalculatorShell";
import {ClinicalManualWorksheet} from "@/components/ClinicalManualWorksheet";
export default function Page(){return <ProductAccessGate active="intubation"><CalculatorShell active="intubation"><ClinicalManualWorksheet mode="intubation"/></CalculatorShell></ProductAccessGate>}
