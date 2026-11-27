import {ProductAccessGate} from "@/components/ProductAccessGate";
import {CalculatorShell} from "@/components/CalculatorShell";
import {ClinicalManualWorksheet} from "@/components/ClinicalManualWorksheet";
export default function Page(){return <ProductAccessGate active="prescription"><CalculatorShell active="prescription"><ClinicalManualWorksheet mode="prescription"/></CalculatorShell></ProductAccessGate>}
