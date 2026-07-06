import { ProductAccessGate } from "@/components/ProductAccessGate";
import { ProductMockPage } from "@/components/ProductMockPage";

export default async function RapidSequenceIntubationPage() {
  return (
    <ProductAccessGate active="intubation">
      <ProductMockPage
        active="intubation"
        eyebrow="Sequência rápida de intubação"
        title="Checklist e cálculo operacional para intubação pediátrica."
        description="Mockup da sequência rápida de intubação com organização por etapas, materiais, medicações e confirmação pós-procedimento."
        primaryMetric="Pré / Indução / Pós"
        secondaryMetric="Checklist ativo"
        sections={[
          {
            title: "Preparação",
            description: "Checklist para equipe, monitorização, acesso, oxigenação e material.",
            items: ["Materiais de via aérea", "Plano A/B/C", "Pré-oxigenação e monitorização"]
          },
          {
            title: "Medicações",
            description: "Estrutura para sedação, analgesia, bloqueador neuromuscular e drogas de suporte.",
            items: ["Dose por peso", "Volume calculado", "Alertas de segurança"]
          },
          {
            title: "Execução",
            description: "Etapas sequenciais para reduzir ruído durante o procedimento.",
            items: ["Indução", "Bloqueio", "Laringoscopia e tubo"]
          },
          {
            title: "Pós-intubação",
            description: "Confirmação, fixação, ventilação e plano de reavaliação.",
            items: ["Capnografia/ausculta", "Fixação e profundidade", "Ventilação e sedação contínua"]
          }
        ]}
      />
    </ProductAccessGate>
  );
}
