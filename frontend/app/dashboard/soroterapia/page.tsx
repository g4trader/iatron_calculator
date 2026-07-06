import { ProductAccessGate } from "@/components/ProductAccessGate";
import { ProductMockPage } from "@/components/ProductMockPage";

export default async function FluidTherapyPage() {
  return (
    <ProductAccessGate active="fluids">
      <ProductMockPage
        active="fluids"
        eyebrow="Cálculo de soroterapia"
        title="Soroterapia pediátrica com volume, manutenção e plano de infusão."
        description="Área visual para cálculo estruturado de volume de manutenção, reposição e infusão, com leitura objetiva para plantão."
        primaryMetric="24h / ml/h"
        secondaryMetric="Plano de volume"
        sections={[
          {
            title: "Parâmetros do paciente",
            description: "Base para inserir idade, peso, condição clínica e objetivo da hidratação.",
            items: ["Peso e faixa etária", "Tipo de necessidade hídrica", "Ajustes por cenário clínico"]
          },
          {
            title: "Manutenção",
            description: "Bloco para exibir cálculo diário e velocidade de infusão.",
            items: ["Volume total em 24h", "Velocidade em ml/h", "Resumo em cards críticos"]
          },
          {
            title: "Reposição e bolus",
            description: "Estrutura para cálculo de reposição com conferência visual.",
            items: ["Bolus por kg", "Volume administrado", "Reavaliação e observações"]
          },
          {
            title: "Plano final",
            description: "Resumo pronto para revisão e impressão no mesmo padrão do produto.",
            items: ["Solução sugerida", "Velocidade final", "Checklist de conferência"]
          }
        ]}
      />
    </ProductAccessGate>
  );
}
