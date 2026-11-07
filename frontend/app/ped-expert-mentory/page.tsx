import Link from "next/link";
import { MentoryIcon } from "@/components/mentory/MentoryIcon";
import "./brand-landing.css";

export const metadata = {
  title: "Ped Expert Mentory | Mentoria em Urgência Pediátrica",
  description: "Mentoria médica em urgência pediátrica com o Dr. Aristóteles Pires. Encontros semanais, conteúdo e comunidade.",
  icons: { icon: "/images/mentory-favicon.png", shortcut: "/images/mentory-favicon.png", apple: "/images/mentory-favicon.png" },
};

const benefits = [
  { icon: "mentor", title: "Mentoria com especialistas" },
  { icon: "book", title: "Conteúdo prático e atualizado" },
  { icon: "cases", title: "Discussão de casos reais" },
  { icon: "award", title: "Mais segurança na prática clínica" },
] as const;

export default function PedExpertMentoryPage() {
  return (
    <main className="mentory-landing">
      <div className="mentory-dark-shell">
        <header className="mentory-nav">
          <div className="mentory-container mentory-nav-inner">
            <Link href="/ped-expert-mentory" className="mentory-logo" aria-label="Ped Expert Mentory, início">
              <img src="/images/mentory-logo-oficial.png" alt="Ped Expert Mentory" />
            </Link>
            <nav aria-label="Navegação principal" className="mentory-nav-links">
              <a href="#inicio" className="active">Home</a>
              <a href="#programa">Mentoria</a>
              <a href="#sobre">Sobre</a>
              <a href="#conteudos">Conteúdos</a>
              <a href="#depoimentos">Depoimentos</a>
            </nav>
            <Link href="/mentory/login" className="mentory-cta mentory-cta-nav">Acessar o sistema</Link>
          </div>
        </header>
        <section id="inicio" className="mentory-hero">
          <div className="mentory-container mentory-hero-grid">
            <div className="mentory-hero-copy">
              <p className="mentory-eyebrow">Mentoria em pediatria</p>
              <h1>Decisões clínicas<br/>mais seguras,<br/><em>na prática.</em></h1>
              <p className="mentory-hero-description">Mentoria para médicos que buscam atualização, raciocínio clínico e mais confiança na condução dos casos do dia a dia.</p>
              <div className="mentory-actions">
                <a className="mentory-cta" href="#programa">Quero participar da mentoria <span aria-hidden="true">→</span></a>
                <a className="mentory-outline" href="#sobre"><span className="mentory-play-small">▶</span> Conheça o programa</a>
              </div>
            </div>
            <div className="mentory-hero-art" aria-label="Fotografia do Dr. Aristóteles Pires">
              <div className="mentory-wave mentory-wave-back" aria-hidden="true"/>
              <div className="mentory-wave mentory-wave-front" aria-hidden="true"/>
              <img className="mentory-hero-portrait" src="/images/a_clean_cutout_portrait_on_a_transparent_backgroun.png" alt="Dr. Aristóteles Pires"/>
            </div>
          </div>
          <div className="mentory-benefits-bar">
            <div className="mentory-container mentory-benefits-inner">
              {benefits.map(({ icon, title }) => <div key={title} className="mentory-benefit"><MentoryIcon name={icon} className="mentory-benefit-icon" /><span>{title}</span></div>)}
            </div>
          </div>
        </section>
      </div>
      <section id="sobre" className="mentory-about">
        <div className="mentory-container mentory-about-grid">
          <div className="mentory-video-card">
            <img src="/images/dr-aristoteles-pires.png" alt="Dr. Aristóteles Pires, mentor da Ped Expert Mentory" />
            <a href="#programa" aria-label="Conheça o programa" className="mentory-video-play">▶</a>
          </div>
          <div className="mentory-about-copy">
            <h2>Sobre a Ped Expert Mentory</h2>
            <p>Uma plataforma de mentoria criada por médicos, para médicos, com foco em educação continuada de alto nível, adequada à realidade da prática clínica.</p>
            <ul>
              <li>Atualização baseada em evidências</li>
              <li>Discussão de casos reais</li>
              <li>Aplicação prática no consultório e no hospital</li>
              <li>Troca direta com especialista</li>
            </ul>
          </div>
        </div>
      </section>
      <section id="programa" className="mentory-program">
        <div className="mentory-container">
          <p className="mentory-section-eyebrow">O programa</p>
          <h2>Formação complementar com acompanhamento e continuidade.</h2>
          <p>Voltada especialmente a médicos recém-formados e em início de carreira, a mentoria combina encontros, conteúdo e recursos de apoio.</p>
          <div id="conteudos" className="mentory-program-cards">
            <article><h3>Encontros semanais ao vivo</h3><p>Discussões educacionais coletivas com o Dr. Aristóteles Pires durante os seis meses de mentoria.</p></article>
            <article><h3>Conteúdo para rever</h3><p>Aulas gravadas e materiais de apoio para aprofundar o aprendizado ao longo do ciclo.</p></article>
            <article><h3>Comunidade Fechada Iatron</h3><p>Acesso à comunidade premium por seis meses, com espaço para trocas profissionais.</p></article>
            <article><h3>Folha PCR</h3><p>Acesso por doze meses ao recurso educacional complementar.</p></article>
          </div>
        </div>
      </section>
      <section id="depoimentos" className="mentory-bottom-cta">
        <div className="mentory-container">
          <h2>Já faz parte da Ped Expert Mentory?</h2>
          <p>Entre com suas credenciais na tela de login do sistema para acessar os recursos disponíveis na sua conta.</p>
          <Link href="/mentory/login" className="mentory-cta">Acessar tela de login →</Link>
        </div>
      </section>
      <footer className="mentory-footer">© Ped Expert Mentory · PEDIATRON · Conteúdo educacional; não substitui supervisão clínica ou atendimento assistencial.</footer>
    </main>
  );
}
