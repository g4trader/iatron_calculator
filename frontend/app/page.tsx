import { Activity, ArrowRight, Check, Clock, Hospital, Shield, Smartphone, Sparkles, Users } from "lucide-react";
import { FunnelBeacon } from "@/components/analytics/FunnelBeacon";
import { NeuralCard, PremiumButton, SaaSNav, SaaSPage, Section } from "@/components/saas/SaaSChrome";

const benefits = [
  { title: "Folha PCR em segundos", text: "Peso, idade, via aérea, drogas úteis e desfibrilação em uma tela focada.", Icon: Clock },
  { title: "Menor ruído operacional", text: "Informações críticas organizadas para plantão, sem navegação desnecessária.", Icon: Shield },
  { title: "Mobile-first", text: "Interface pensada para consulta rápida em emergência, ambulância e UTI.", Icon: Smartphone },
  { title: "Padronização da folha", text: "Experiência digital versionada para reduzir variação na consulta operacional.", Icon: Activity },
  { title: "Apoio inteligente", text: "Base preparada para evoluir com auditoria, histórico e futuras camadas de IA.", Icon: Sparkles },
  { title: "Uso institucional", text: "Plano assistido para equipes que querem padronizar a Folha PCR no serviço.", Icon: Users }
];

const audiences = ["Pediatras", "Emergência", "UTI", "SAMU", "Hospitais", "Acadêmicos"];

const plans = [
  {
    name: "Professional",
    price: "R$ 249",
    suffix: "/ano",
    text: "Assinatura anual individual da Folha PCR digital.",
    featured: true,
    ctaLabel: "Assinar anual",
    features: ["Folha PCR digital", "Histórico de cálculos", "Impressão e PDF"]
  },
  {
    name: "Hospital",
    price: "Sob consulta",
    suffix: "",
    text: "Implantação assistida da Folha PCR para equipes clínicas.",
    ctaLabel: "Solicitar implantação",
    features: ["Times e permissões", "Licenças institucionais", "Apoio de implantação"]
  }
];

export default function LandingPage() {
  return (
    <SaaSPage>
      <FunnelBeacon step="landing_view" source="landing" scope="home" />
      <SaaSNav />

      <section className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-2 text-sm font-semibold text-cyan-100">
            Folha PCR pediátrica com experiência healthtech AI
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
            Folha PCR pediátrica em segundos para decisões críticas no plantão.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Um produto focado em entubação, parada cardíaca, drogas úteis e desfibrilação para médicos que precisam consultar rápido e com menos ruído.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PremiumButton href="/checkout">Começar agora</PremiumButton>
            <PremiumButton href="/dashboard" variant="secondary">Testar gratuitamente</PremiumButton>
          </div>
        </div>

        <NeuralCard className="p-4">
          <div className="rounded-lg border border-cyan-300/10 bg-[#07111F] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-black text-white">Folha PCR</p>
              <span className="rounded-md bg-cyan-300 px-2 py-1 text-xs font-black text-slate-950">Realtime</span>
            </div>
            <div className="grid gap-3">
              {["Peso 15 kg", "Doses < 1 ml: 8", "Choque inicial 30 J", "Tubo 4,5"].map((item) => (
                <div key={item} className="rounded-md border border-cyan-300/10 bg-slate-950/70 p-4 text-lg font-black text-cyan-100">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </NeuralCard>
      </section>

      <Section id="como-funciona" eyebrow="Como funciona" title="Da identificação do paciente à Folha PCR pronta em três passos.">
        <div className="grid gap-4 md:grid-cols-3">
          {["Informe paciente, peso e idade", "Revise a Folha PCR calculada", "Imprima ou gere PDF para apoio"].map((step, index) => (
            <NeuralCard key={step} className="p-5">
              <p className="mb-8 text-sm font-black text-cyan-200">0{index + 1}</p>
              <h3 className="text-xl font-black text-white">{step}</h3>
            </NeuralCard>
          ))}
        </div>
      </Section>

      <Section id="beneficios" eyebrow="Benefícios" title="Tudo o que importa, sem ruído visual.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({ title, text, Icon }) => (
            <NeuralCard key={title} className="p-5">
              <Icon className="mb-5 h-5 w-5 text-cyan-200" aria-hidden="true" />
              <h3 className="font-black text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </NeuralCard>
          ))}
        </div>
      </Section>

      <Section title="Feito para quem opera sob pressão clínica.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {audiences.map((item) => (
            <NeuralCard key={item} className="p-4 text-center font-black text-white">
              <Hospital className="mx-auto mb-3 h-5 w-5 text-cyan-200" aria-hidden="true" />
              {item}
            </NeuralCard>
          ))}
        </div>
      </Section>

      <Section id="planos" eyebrow="Planos" title="Assinatura anual da Folha PCR para uso individual.">
        <FunnelBeacon step="pricing_view" source="landing" scope="plans_section" />
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <NeuralCard key={plan.name} className={`p-6 ${plan.featured ? "border-cyan-300/45 bg-cyan-300/8" : ""}`}>
              <h3 className="text-xl font-black text-white">{plan.name}</h3>
              <p className="mt-4 text-4xl font-black text-white">{plan.price}<span className="text-sm text-slate-400">{plan.suffix}</span></p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{plan.text}</p>
              <div className="mt-6 grid gap-3">
                {plan.features.map((feature) => (
                  <p key={feature} className="flex items-center gap-2 text-sm text-slate-200">
                    <Check className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                    {feature}
                  </p>
                ))}
              </div>
              <PremiumButton href="/checkout" variant={plan.featured ? "primary" : "secondary"}>
                {plan.ctaLabel} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </PremiumButton>
            </NeuralCard>
          ))}
        </div>
      </Section>
    </SaaSPage>
  );
}
