import { Activity, ArrowRight, BadgeCheck, Check, Clock, FileCheck, Hospital, Instagram, Quote, Shield, Smartphone, Sparkles, Stethoscope, Users } from "lucide-react";
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

const socialProof = [
  {
    title: "Nasceu da rotina real de plantão",
    text: "A experiência digital foi desenhada a partir da lógica operacional de uma Folha PCR usada para consulta rápida em emergência pediátrica.",
    Icon: FileCheck
  },
  {
    title: "Foco clínico antes de volume de features",
    text: "O MVP concentra a atenção em entubação, parada cardíaca, drogas úteis e desfibrilação, sem transformar o plantão em uma tela de ERP.",
    Icon: Stethoscope
  },
  {
    title: "Padronização para reduzir ruído",
    text: "A proposta é organizar informações críticas em um fluxo único, com impressão e PDF para apoiar conferência, comunicação e registro.",
    Icon: BadgeCheck
  }
];

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

      <section className="relative isolate overflow-hidden border-b border-cyan-300/10">
        <div className="absolute inset-0 -z-30 bg-[url('/images/iatron-hero-hospital.png')] bg-cover bg-[62%_center] opacity-55" aria-hidden="true" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_72%_38%,rgba(34,211,238,0.2),transparent_28rem),linear-gradient(90deg,#030712_0%,rgba(3,7,18,0.94)_34%,rgba(3,7,18,0.72)_68%,rgba(3,7,18,0.88)_100%)]" aria-hidden="true" />
        <div className="hero-data-field absolute inset-x-0 top-0 -z-10 h-full opacity-70" aria-hidden="true" />

        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-8 px-4 py-10 sm:min-h-[660px] sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.58fr)] lg:px-8 lg:py-14">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-cyan-300/20 bg-slate-950/55 px-3 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur">
              Folha PCR pediátrica com experiência healthtech AI
            </div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Folha PCR pediátrica em segundos para decisões críticas no plantão.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Um produto focado em entubação, parada cardíaca, drogas úteis e desfibrilação para médicos que precisam consultar rápido e com menos ruído.
            </p>
            <div className="mt-6 grid max-w-2xl grid-cols-3 gap-2 text-sm text-slate-300 sm:gap-3">
              {["R$249/ano", "Folha PCR", "Mobile-first"].map((item) => (
                <div key={item} className="rounded-lg border border-cyan-300/12 bg-slate-950/45 px-3 py-3 font-bold backdrop-blur">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <PremiumButton href="/checkout">Começar agora</PremiumButton>
              <PremiumButton href="/dashboard" variant="secondary">Testar gratuitamente</PremiumButton>
            </div>
          </div>

          <div className="hero-tech-panel relative hidden rounded-2xl border border-cyan-200/35 bg-slate-950/58 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.48)] backdrop-blur-xl lg:block">
            <div className="rounded-xl border border-cyan-300/10 bg-[#06101e]/90 p-4">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black tracking-[0.22em] text-cyan-200/70">NEURAL CLINICAL ENGINE</p>
                  <p className="mt-1 text-xl font-black text-white">Folha PCR</p>
                </div>
                <span className="hero-live-dot rounded-md bg-cyan-300 px-2 py-1 text-xs font-black text-slate-950">Realtime</span>
              </div>
              <div className="grid gap-3">
                {["Peso 15 kg", "Choque inicial 30 J", "Drogas críticas filtradas", "Tubo 4,5"].map((item, index) => (
                  <div key={item} className="rounded-lg border border-cyan-300/10 bg-slate-950/72 p-4">
                    <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="hero-signal h-full rounded-full bg-cyan-300" style={{ width: `${62 + index * 9}%` }} />
                    </div>
                    <p className="text-lg font-black text-cyan-50">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section eyebrow="Prova social" title="Construído para a pressão real da emergência pediátrica.">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <NeuralCard className="p-6">
            <Quote className="mb-6 h-6 w-6 text-cyan-200" aria-hidden="true" />
            <p className="text-2xl font-black leading-tight text-white">
              A Folha PCR digital transforma uma consulta operacional crítica em uma experiência rápida, padronizada e pronta para plantão.
            </p>
            <p className="mt-5 text-sm leading-6 text-slate-400">
              O objetivo do Iatron é reduzir atrito cognitivo no momento em que cada segundo importa, mantendo a conferência clínica e o protocolo institucional como parte central do uso.
            </p>
          </NeuralCard>

          <div className="grid gap-4 md:grid-cols-3">
            {socialProof.map(({ title, text, Icon }) => (
              <NeuralCard key={title} className="p-5">
                <Icon className="mb-5 h-5 w-5 text-cyan-200" aria-hidden="true" />
                <h3 className="font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
              </NeuralCard>
            ))}
          </div>
        </div>
      </Section>

      <Section eyebrow="Responsável médico" title="Visão clínica conduzida por quem conhece a rotina do plantão.">
        <NeuralCard className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="relative min-h-[360px] overflow-hidden bg-[radial-gradient(circle_at_50%_24%,rgba(103,232,249,0.2),transparent_18rem),#07111F]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(103,232,249,0.08),transparent_42%),linear-gradient(rgba(103,232,249,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.03)_1px,transparent_1px)] bg-[auto,34px_34px,34px_34px]" aria-hidden="true" />
              <div className="absolute inset-x-8 bottom-8 top-8 flex items-center justify-center rounded-2xl border border-cyan-300/15 bg-slate-950/45 shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur">
                <div className="text-center">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-cyan-200/35 bg-cyan-300/10 text-4xl font-black text-cyan-100 shadow-[0_0_60px_rgba(34,211,238,0.18)]">
                    AP
                  </div>
                  <p className="mt-5 text-sm font-black tracking-[0.22em] text-cyan-200/70">MÉDICO RESPONSÁVEL</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="mb-5 inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-2 text-sm font-bold text-cyan-100">
                Dr. Aristóteles de Almeida Pires
              </div>
              <h3 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                A camada clínica do Iatron parte de uma necessidade prática: consultar rápido sem perder rigor.
              </h3>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                O produto foi estruturado para apoiar médicos em cenários pediátricos críticos, traduzindo uma Folha PCR operacional em uma interface digital mais limpa, navegável e pronta para uso em dispositivos móveis.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {["Foco em emergência", "Padronização clínica", "Experiência mobile"].map((item) => (
                  <div key={item} className="rounded-lg border border-cyan-300/10 bg-slate-950/55 p-4 text-sm font-bold text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
              <a
                href="https://www.instagram.com/dr.aristotelespires?igsh=dmV6dWZ3bjhxNG0z"
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center rounded-lg border border-cyan-300/20 bg-slate-950/60 px-4 py-3 text-sm font-black text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/10"
              >
                <Instagram className="mr-2 h-4 w-4" aria-hidden="true" />
                Ver perfil no Instagram
              </a>
            </div>
          </div>
        </NeuralCard>
      </Section>

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
