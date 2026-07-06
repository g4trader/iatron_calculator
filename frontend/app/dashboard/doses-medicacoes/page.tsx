import { ProductAccessGate } from "@/components/ProductAccessGate";
import { ProductMockPage } from "@/components/ProductMockPage";

export default async function MedicationDosesPage() {
  return (
    <ProductAccessGate active="doses">
      <ProductMockPage
        active="doses"
        eyebrow="Cálculo de doses de medicações"
        title="Top 100 medicações pediátricas com consulta rápida por peso e idade."
        description="Mockup da área de cálculo e busca das principais medicações usadas em pediatria, mantendo o mesmo padrão de cards, alertas e organização progressiva."
        primaryMetric="Top 100"
        secondaryMetric="Dose por kg"
        sections={[
          {
            title: "Busca clínica",
            description: "Entrada rápida para localizar medicação por nome, classe ou cenário.",
            items: ["Filtro por medicação", "Filtro por emergência, sedação, analgesia e antibiótico", "Favoritos de uso frequente"]
          },
          {
            title: "Resultado calculado",
            description: "Cards com dose, volume, apresentação, via e limites máximos.",
            items: ["Dose em mg/mcg e volume em ml", "Limite máximo destacado", "Alerta para volume menor que 1 ml"]
          },
          {
            title: "Diluição e administração",
            description: "Campos preparados para diluição, velocidade e observações de preparo.",
            items: ["Diluição sugerida", "Velocidade quando aplicável", "Notas de compatibilidade/protocolo"]
          },
          {
            title: "Revisão e impressão",
            description: "Organização para levar apenas o necessário ao fluxo de impressão/PDF.",
            items: ["Lista selecionada", "Resumo por paciente", "Exportação no padrão da Folha PCR"]
          }
        ]}
      />
    </ProductAccessGate>
  );
}
