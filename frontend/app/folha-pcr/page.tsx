import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  Check,
  ClipboardList,
  FileCheck,
  HeartPulse,
  Hospital,
  Instagram,
  Printer,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Users,
} from "lucide-react";
import { MobileMenu } from "@/components/MobileMenu";
import { Brand } from "@/components/Brand";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { FunnelBeacon } from "@/components/analytics/FunnelBeacon";
import { getCurrentUser } from "@/lib/authz";
import {
  getPricingView,
  getDefaultPriceForPlan,
  formatPrice,
} from "@/lib/pricing";

export const metadata: Metadata = {
  title: "PED.iatron | Folha PCR pediátrica",
  description:
    "Via aérea, desfibrilação e medicações organizadas na Folha PCR pediátrica. Consulte os resultados e imprima para apoiar a conferência clínica.",
  alternates: { canonical: "https://pediatron.com.br/folha-pcr" },
};
const features = [
  {
    Icon: FileCheck,
    title: "Consulta organizada",
    text: "Peso, idade, via aérea, medicações e desfibrilação em uma folha de consulta.",
  },
  {
    Icon: Stethoscope,
    title: "Foco no atendimento",
    text: "Informações agrupadas por etapa para apoiar a conferência durante o plantão.",
  },
  {
    Icon: Smartphone,
    title: "Também no celular",
    text: "A mesma Folha PCR, em uma interface que acompanha sua rotina.",
  },
  {
    Icon: Printer,
    title: "Impressão e PDF",
    text: "Leve os resultados para a impressão ou salve em PDF pelo navegador.",
  },
];
const steps = [
  {
    Icon: ClipboardList,
    title: "Informe os dados",
    text: "Preencha nome, data, idade e peso do paciente.",
  },
  {
    Icon: FileCheck,
    title: "Cálculo automático",
    text: "Ao preencher idade e peso, os resultados são atualizados automaticamente.",
  },
  {
    Icon: Printer,
    title: "Imprima a folha",
    text: "Consulte na tela, imprima ou salve como PDF.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  return (
    <div className="ped-theme ped-landing">
      <FunnelBeacon step="landing_view" source="landing" scope="home" />
      <a className="ped-skip" href="#landing-content">
        Ir para o conteúdo
      </a>
      <header className="ped-lp-header">
        <nav className="ped-container" aria-label="Navegação principal">
          <Brand />
          <div className="ped-lp-links">
            <a href="#como-funciona">Como funciona</a>
            <a href="#beneficios">Benefícios</a>
            <a href="#planos">Planos</a>
          </div>
          <MobileMenu>
            <a href="#como-funciona">Como funciona</a>
            <a href="#beneficios">Benefícios</a>
            <a href="#planos">Planos</a>
            <Link href={user ? "/dashboard" : "/login"}>
              {user ? "Folha PCR" : "Entrar"}
            </Link>
            <Link href="/checkout">Começar agora</Link>
          </MobileMenu>
          <div className="ped-lp-account">
            {user ? (
              <>
                <Link
                  className="ped-button ped-button-secondary"
                  href="/dashboard"
                >
                  Folha PCR
                </Link>
                <Link className="ped-organization-link" href="/organization">
                  Organização
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link className="ped-login-link" href="/login">
                  Entrar
                </Link>
                <Link
                  className="ped-button ped-button-primary"
                  href="/checkout"
                >
                  Começar agora
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main id="landing-content">
        <section className="ped-hero">
          <div className="ped-container ped-hero-grid">
            <div className="ped-hero-copy">
              <span className="ped-badge">
                <HeartPulse aria-hidden="true" /> Folha PCR pediátrica
              </span>
              <h1>
                Mais clareza no
                <br className="ped-desktop-break" />{" "}
                <em>plantão pediátrico.</em>
              </h1>
              <p>
                Via aérea, medicações e desfibrilação em uma folha digital para
                consulta e conferência no atendimento.
              </p>
              <div className="ped-hero-actions">
                <Link
                  href="/checkout"
                  className="ped-button ped-button-primary"
                >
                  Começar agora <ArrowRight aria-hidden="true" />
                </Link>
                <a
                  href="#como-funciona"
                  className="ped-button ped-button-secondary"
                >
                  Ver como funciona
                </a>
              </div>
              <p className="ped-hero-note">
                Apoio ao cálculo. A avaliação clínica e o protocolo
                institucional permanecem essenciais.
              </p>
            </div>
            <figure
              className="ped-demo-browser"
              aria-label="Demonstração estática do formulário, com dados fictícios"
            >
              <div className="ped-demo-chrome">
                <span aria-hidden="true">● ● ●</span>
                <span>PED.iatron / Folha PCR</span>
              </div>
              <div className="ped-demo-body">
                <span className="ped-eyebrow">
                  Demonstração · dados fictícios
                </span>
                <h2>Entubação e PCR</h2>
                <p>Dados do paciente</p>
                <dl className="ped-demo-identity">
                  <div>
                    <dt>Nome do paciente</dt>
                    <dd>Paciente demonstrativo</dd>
                  </div>
                  <div>
                    <dt>Data</dt>
                    <dd>14/10/2026</dd>
                  </div>
                </dl>
                <dl className="ped-demo-fields">
                  <div>
                    <dt>Anos</dt>
                    <dd>5</dd>
                  </div>
                  <div>
                    <dt>Meses</dt>
                    <dd>2</dd>
                  </div>
                  <div>
                    <dt>Peso (kg)</dt>
                    <dd>15</dd>
                  </div>
                </dl>
                <p className="ped-demo-status">
                  <Activity aria-hidden="true" /> Atualização automática ao
                  preencher os dados
                </p>
                <div className="ped-demo-next">
                  <FileCheck aria-hidden="true" />
                  <div>
                    <strong>Da identificação à consulta</strong>
                    <p>
                      Via aérea, choques, medicações e avisos em uma folha
                      organizada.
                    </p>
                  </div>
                </div>
              </div>
              <figcaption>
                Representação do formulário · sem resultados clínicos
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="beneficios" className="ped-container ped-lp-section">
          <p className="ped-eyebrow">Foco no que realmente importa</p>
          <h2>Criado para a rotina da emergência pediátrica.</h2>
          <div className="ped-features">
            {features.map(({ Icon, title, text }) => (
              <article className="ped-card" key={title}>
                <span className="ped-feature-icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ped-doctor-section">
          <div className="ped-container ped-doctor-grid">
            <figure className="ped-doctor-photo">
              <Image
                src="/images/dr-aristoteles-pires.png"
                alt="Dr. Aristóteles de Almeida Pires"
                fill
                sizes="(min-width: 768px) 320px, 85vw"
              />
              <figcaption>
                <strong>Dr. Aristóteles de Almeida Pires</strong>
                <span>Médico responsável</span>
              </figcaption>
            </figure>
            <div>
              <span className="ped-badge">
                <Stethoscope aria-hidden="true" />
                Experiência que faz a diferença
              </span>
              <h2>
                Mais de 25 anos de experiência conectando prática clínica,
                telemedicina e educação.
              </h2>
              <p>
                O Dr. Aristóteles de Almeida Pires é médico com trajetória
                dedicada à prática clínica, inovação em saúde e formação de
                profissionais. Doutor em telemedicina e mentor de carreira
                médica, conduz a visão clínica do PED.iatron para transformar
                rotinas críticas em ferramentas digitais mais claras, rápidas e
                úteis no atendimento real.
              </p>
              <p>
                A Folha PCR nasce dessa interseção entre experiência
                assistencial, tecnologia aplicada e compromisso com decisões
                médicas mais organizadas no plantão.
              </p>
              <div className="ped-credentials">
                <span>
                  <strong>25+ anos</strong>de experiência
                </span>
                <span>
                  <strong>Doutorado</strong>em telemedicina
                </span>
                <span>
                  <strong>Mentor</strong>de carreira médica
                </span>
              </div>
              <a
                className="ped-button ped-button-secondary"
                href="https://www.instagram.com/dr.aristotelespires?igsh=dmV6dWZ3bjhxNG0z"
                target="_blank"
                rel="noreferrer"
              >
                <Instagram aria-hidden="true" />
                Ver perfil no Instagram
              </a>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="ped-container ped-lp-section">
          <p className="ped-eyebrow">Como funciona</p>
          <h2>Da identificação ao resultado, em três passos.</h2>
          <div className="ped-steps">
            {steps.map(({ Icon, title, text }, index) => (
              <article key={title}>
                <span className="ped-feature-icon">
                  <Icon aria-hidden="true" />
                </span>
                <div>
                  <span className="ped-step-number">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="ped-container ped-audience-section">
          <h2>Para quem está na linha de frente.</h2>
          <div className="ped-audiences">
            {[
              "Pediatras",
              "Emergência",
              "UTI pediátrica",
              "SAMU",
              "Hospitais",
              "Acadêmicos",
            ].map((item) => (
              <div key={item}>
                <Hospital aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
        <section id="planos" className="ped-container ped-lp-section">
          <FunnelBeacon
            step="pricing_view"
            source="landing"
            scope="plans_section"
          />
          <p className="ped-eyebrow">Planos</p>
          <h2>Acesso individual ou para sua instituição.</h2>
          <p className="ped-section-description">
            Escolha a modalidade para a sua rotina.
          </p>
          <Suspense
            fallback={
              <div className="ped-card ped-pricing-empty" role="status">
                Carregando planos e condições…
              </div>
            }
          >
            <PricingCatalog />
          </Suspense>
        </section>
      </main>
      <footer className="ped-container ped-footer">
        <div>
          <Brand />
          <p>Tecnologia a serviço do cuidado.</p>
        </div>
        <nav aria-label="Links do rodapé">
          <a href="#como-funciona">Como funciona</a>
          <a href="#planos">Planos</a>
          <Link href="/login">Entrar</Link>
        </nav>
        <p className="ped-footer-disclaimer">
          Ferramenta de apoio ao cálculo. Conferir dose, apresentação,
          concentração, protocolo institucional e avaliação clínica antes da
          administração.
        </p>
      </footer>
    </div>
  );
}

async function PricingCatalog() {
  const pricing = await getPricingView().catch(() => null);
  const plans = pricing
    ? [...pricing.individualPlans, ...pricing.institutionalPlans]
    : [];
  return (
    <>
      <div className="ped-plans">
        {plans.map((plan) => {
          const price = getDefaultPriceForPlan(plan);
          const individual = plan.audience === "INDIVIDUAL";
          return (
            <article
              key={plan.id}
              className={`ped-card ped-plan ${individual ? "ped-plan-featured" : ""}`}
            >
              <div className="ped-plan-heading">
                {individual ? (
                  <Stethoscope aria-hidden="true" />
                ) : (
                  <Users aria-hidden="true" />
                )}
                <h3>{plan.name}</h3>
              </div>
              <p className="ped-plan-price">
                {formatPrice(price?.amountCents ?? null, price?.currency)}
                {price && !price.isCustom && (
                  <span> / {price.billingCycleLabel.toLowerCase()}</span>
                )}
              </p>
              <p>
                {plan.description ||
                  (individual
                    ? "Acesso individual à Folha PCR digital."
                    : "Acesso institucional para equipes clínicas.")}
              </p>
              <ul>
                {(individual
                  ? [
                      "Folha PCR digital",
                      "Consulta em desktop e celular",
                      "Impressão e PDF",
                    ]
                  : [
                      "Times e permissões",
                      "Licenças institucionais",
                      "Gestão de acesso da equipe",
                    ]
                ).map((feature) => (
                  <li key={feature}>
                    <Check aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/checkout"
                className={`ped-button ${individual ? "ped-button-primary" : "ped-button-secondary"}`}
              >
                {individual
                  ? "Ver assinatura"
                  : "Consultar plano institucional"}
                <ArrowRight aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>
      {plans.length === 0 && (
        <div className="ped-card ped-pricing-empty">
          <ShieldCheck aria-hidden="true" />
          <div>
            <h3>
              {pricing
                ? "Nenhum plano disponível no momento"
                : "Não foi possível carregar os planos"}
            </h3>
            <p>Preços e condições serão apresentados na contratação.</p>
          </div>
          <Link href="/checkout" className="ped-button ped-button-primary">
            Consultar planos <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      )}
    </>
  );
}
