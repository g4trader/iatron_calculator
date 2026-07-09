import { Activity, ArrowRight, BadgeCheck, Check, Clock, FileCheck, Hospital, Instagram, Quote, Shield, Smartphone, Sparkles, Stethoscope, Users } from "lucide-react";
import Image from "next/image";
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

const productFocus = [
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

const testimonials = [
  {
    quote: "A principal diferença é conseguir chegar rápido ao que importa, sem procurar em várias tabelas durante um cenário crítico.",
    role: "Pediatra plantonista",
    context: "Emergência pediátrica"
  },
  {
    quote: "A organização da Folha PCR reduz ruído no atendimento. Peso, via aérea, desfibrilação e drogas ficam em uma sequência mais lógica.",
    role: "Médico emergencista",
    context: "Pronto atendimento"
  },
  {
    quote: "No celular, a experiência fica muito mais prática do que consultar uma planilha durante o plantão.",
    role: "Médica de UTI pediátrica",
    context: "Uso mobile em rotina assistencial"
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

      <section className="preserve-dark-surface relative isolate overflow-hidden border-b border-cyan-300/10">
        <div className="absolute inset-0 -z-30 bg-[url('/images/iatron-hero-hospital.png')] bg-cover bg-[62%_center] opacity-55" aria-hidden="true" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_72%_38%,rgba(34,211,238,0.2),transparent_28rem),linear-gradient(90deg,#030712_0%,rgba(3,7,18,0.94)_34%,rgba(3,7,18,0.72)_68%,rgba(3,7,18,0.88)_100%)]" aria-hidden="true" />
        <div className="hero-data-field absolute inset-x-0 top-0 -z-10 h-full opacity-70" aria-hidden="true" />

        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-8 px-4 py-10 sm:min-h-[660px] sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.58fr)] lg:px-8 lg:py-14">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-cyan-300/20 bg-slate-950/55 px-3 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur">
              iatron.PED · Folha PCR pediátrica com experiência healthtech AI
            </div>
            <h1 className="hero-copy-title max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Folha PCR pediátrica em segundos para decisões críticas no plantão.
            </h1>
            <p className="hero-copy-subtitle mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
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
            <div className="hero-clinical-panel rounded-xl border border-cyan-300/10 bg-[#06101e]/90 p-4">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="hero-engine-label text-xs font-black tracking-[0.22em] text-cyan-200/70">NEURAL CLINICAL ENGINE</p>
                  <p className="mt-1 text-xl font-black text-white">Folha PCR</p>
                </div>
                <span className="hero-live-dot rounded-md bg-cyan-300 px-2 py-1 text-xs font-black text-slate-950">Realtime</span>
              </div>
              <div className="grid gap-3">
                {["Peso 15 kg", "Choque inicial 30 J", "Drogas críticas filtradas", "Tubo 4,5"].map((item, index) => (
                  <div key={item} className="hero-metric-card rounded-lg border border-cyan-300/10 bg-slate-950/72 p-4">
                    <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="hero-signal h-full rounded-full bg-cyan-300" style={{ width: `${62 + index * 9}%` }} />
                    </div>
                    <p className="hero-metric-text text-lg font-black text-cyan-50">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section eyebrow="Foco do produto" title="Construído para a pressão real da emergência pediátrica.">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <NeuralCard className="p-6">
            <Quote className="mb-6 h-6 w-6 text-cyan-200" aria-hidden="true" />
            <p className="text-2xl font-black leading-tight text-white">
              A Folha PCR digital transforma uma consulta operacional crítica em uma experiência rápida, padronizada e pronta para plantão.
            </p>
            <p className="mt-5 text-sm leading-6 text-slate-400">
              O objetivo do iatron.PED é reduzir atrito cognitivo no momento em que cada segundo importa, mantendo a conferência clínica e o protocolo institucional como parte central do uso.
            </p>
          </NeuralCard>

          <div className="grid gap-4 md:grid-cols-3">
            {productFocus.map(({ title, text, Icon }) => (
              <NeuralCard key={title} className="p-5">
                <Icon className="mb-5 h-5 w-5 text-cyan-200" aria-hidden="true" />
                <h3 className="font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
              </NeuralCard>
            ))}
          </div>
        </div>
      </Section>

      <Section eyebrow="Responsável médico" title="Experiência médica, tecnologia e formação aplicadas ao plantão.">
        <NeuralCard className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="relative min-h-[360px] overflow-hidden bg-[radial-gradient(circle_at_50%_24%,rgba(103,232,249,0.2),transparent_18rem),#07111F]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(103,232,249,0.08),transparent_42%),linear-gradient(rgba(103,232,249,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.03)_1px,transparent_1px)] bg-[auto,34px_34px,34px_34px]" aria-hidden="true" />
              <div className="absolute inset-x-8 bottom-8 top-8 overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950/45 shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur">
                <Image
                  src="/images/dr-aristoteles-pires.png"
                  alt="Dr. Aristóteles de Almeida Pires"
                  fill
                  sizes="(min-width: 1024px) 31vw, 100vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/88 via-slate-950/30 to-transparent p-5">
                  <p className="text-sm font-black tracking-[0.22em] text-cyan-100/90">MÉDICO RESPONSÁVEL</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="mb-5 inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-2 text-sm font-bold text-cyan-100">
                Dr. Aristóteles de Almeida Pires
              </div>
              <h3 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Mais de 25 anos de experiência médica conectando prática clínica, telemedicina e educação profissional.
              </h3>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                O Dr. Aristóteles de Almeida Pires é médico com trajetória dedicada à prática clínica, inovação em saúde e formação de profissionais. Doutor em telemedicina e mentor de carreira médica, conduz a visão clínica do iatron.PED para transformar rotinas críticas em ferramentas digitais mais claras, rápidas e úteis no atendimento real.
              </p>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-400">
                A Folha PCR nasce dessa interseção entre experiência assistencial, tecnologia aplicada e compromisso com decisões médicas mais organizadas no plantão.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {["25+ anos de experiência", "Doutorado em telemedicina", "Mentor de carreira médica"].map((item) => (
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

      <Section eyebrow="Testemunhos" title="O que médicos destacam ao usar a Folha PCR digital.">
        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((item) => (
            <NeuralCard key={item.role} className="p-6">
              <Quote className="mb-6 h-5 w-5 text-cyan-200" aria-hidden="true" />
              <p className="text-lg font-black leading-8 text-white">“{item.quote}”</p>
              <div className="mt-8 border-t border-cyan-300/10 pt-5">
                <p className="font-black text-cyan-100">{item.role}</p>
                <p className="mt-1 text-sm text-slate-400">{item.context}</p>
              </div>
            </NeuralCard>
          ))}
        </div>
        <p className="mt-5 text-xs leading-6 text-slate-500">
          Testemunhos anonimizados por perfil profissional para preservar identidade e contexto assistencial.
        </p>
      </Section>
    </SaaSPage>
  );
}
