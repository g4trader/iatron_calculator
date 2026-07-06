import { ProductAccessGate } from "@/components/ProductAccessGate";
import { ProductMockPage } from "@/components/ProductMockPage";

export default async function PrescriptionModelPage() {
  return (
    <ProductAccessGate active="prescription">
      <ProductMockPage
        active="prescription"
        eyebrow="Modelo de prescrição"
        title="Modelo de prescrição pediátrica para organização rápida do atendimento."
        description="Área preparada para estruturar prescrição, identificação do paciente, parâmetros clínicos e campos essenciais para conferência antes da conduta."
        primaryMetric="5A 6M 15kg"
        secondaryMetric="Prescrição organizada"
        sections={[
          {
            title: "Identificação e contexto",
            description: "Bloco inicial para paciente, data, peso, idade e cenário clínico.",
            items: ["Dados do paciente em formato compacto", "Campo para hipótese/indicação", "Resumo de parâmetros relevantes"]
          },
          {
            title: "Estrutura da prescrição",
            description: "Modelo visual para separar medicações, soluções, cuidados e observações.",
            items: ["Medicação e apresentação", "Dose e via", "Frequência, diluição e observações"]
          },
          {
            title: "Conferência clínica",
            description: "Área de revisão para reduzir ruído e facilitar validação antes de imprimir.",
            items: ["Checklist de segurança", "Campos de protocolo institucional", "Pronto para impressão/PDF"]
          },
          {
            title: "Histórico futuro",
            description: "Base visual para salvar modelos usados e acelerar novos atendimentos.",
            items: ["Favoritos por perfil", "Últimas prescrições", "Notas internas do atendimento"]
          }
        ]}
      />
    </ProductAccessGate>
  );
}
