import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpenCheck, CalendarDays, HeartPulse, Instagram, Menu, MessageCircle, ShieldCheck, Stethoscope, Users } from "lucide-react";
import "./pediatron-home.css";

const base = "https://pediatron.com.br";
export const metadata: Metadata = {
  title: "Pediatron | Educação médica, comunidade e ferramentas para pediatria",
  description: "Conheça a Pediatron: Ped Expert Mentory com Dr. Aristóteles Pires, comunidade médica no WhatsApp e Folha PCR para apoio à prática pediátrica.",
  alternates: { canonical: base },
  openGraph: { title: "Pediatron | Conhecimento que acompanha a prática", description: "Mentoria, comunidade e ferramentas digitais para a rotina da pediatria.", url: base, siteName: "Pediatron", locale: "pt_BR", type: "website", images: [{ url: "/images/dr-aristoteles-pires.png", alt: "Dr. Aristóteles Pires" }] },
  twitter: { card: "summary_large_image", images: ["/images/dr-aristoteles-pires.png"] },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": base + "/#organization", name: "Pediatron", url: base, description: "Ecossistema de educação médica, comunidade e ferramentas digitais para pediatria." },
    { "@type": "WebSite", "@id": base + "/#website", name: "Pediatron", url: base, inLanguage: "pt-BR", publisher: { "@id": base + "/#organization" } },
    { "@type": "WebPage", "@id": base + "/#webpage", url: base, name: "Pediatron | Educação médica, comunidade e ferramentas para pediatria", inLanguage: "pt-BR", isPartOf: { "@id": base + "/#website" } }
  ]
};

export default function PediatronHome() {
  return (
    <main className="pediatron-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <a className="pediatron-skip" href="#conteudo">Ir para o conteúdo</a>
      <header className="pediatron-header">
        <div className="pediatron-shell pediatron-header-inner">
          <Link className="pediatron-wordmark" href="/" aria-label="Pediatron, início"><span className="pediatron-wordmark-symbol"><HeartPulse aria-hidden="true" /></span><span>PEDIATRON<span className="pediatron-wordmark-dot">.</span></span></Link>
          <nav className="pediatron-nav" aria-label="Navegação principal"><a href="#solucoes">Soluções</a><a href="#especialista">Especialista</a><a href="#sobre">Sobre a Pediatron</a></nav>
          <Link className="pediatron-header-cta" href="/ped-expert-mentory">Conheça a mentoria <ArrowRight size={17} aria-hidden="true"/></Link>
          <details className="pediatron-mobile-nav"><summary aria-label="Abrir menu"><Menu aria-hidden="true" /></summary><nav aria-label="Menu mobile"><a href="#solucoes">Soluções</a><a href="#especialista">Especialista</a><a href="#sobre">Sobre a Pediatron</a><Link href="/ped-expert-mentory">Ped Expert Mentory</Link><Link href="/folha-pcr">Folha PCR</Link></nav></details>
        </div>
      </header>
      <section className="pediatron-hero" id="conteudo">
        <div className="pediatron-shell pediatron-hero-inner">
          <div className="pediatron-hero-copy">
            <span className="pediatron-kicker"><span className="pediatron-kicker-line"/> CIÊNCIA, EXPERIÊNCIA E CONEXÃO</span>
            <h1>O conhecimento que transforma a <em>prática pediátrica.</em></h1>
            <p>Uma nova forma de aprender, trocar experiências e contar com recursos para os desafios da medicina. Conheça o ecossistema Pediatron.</p>
            <div className="pediatron-hero-actions"><a className="pediatron-btn pediatron-btn-primary" href="#solucoes">Explore nossas soluções <ArrowRight aria-hidden="true" /></a><a className="pediatron-btn pediatron-btn-ghost" href="#especialista">Conheça o especialista</a></div>
            <div className="pediatron-hero-proof"><span><BookOpenCheck aria-hidden="true"/> Educação continuada</span><span><Users aria-hidden="true"/> Conexão entre médicos</span><span><ShieldCheck aria-hidden="true"/> Apoio à prática</span></div>
          </div>
          <div className="pediatron-hero-visual" aria-label="Dr. Aristóteles Pires, médico e mentor">
            <div className="pediatron-hero-halo" aria-hidden="true" />
            <Image src="/images/a_clean_cutout_portrait_on_a_transparent_backgroun.png" alt="Dr. Aristóteles Pires" fill priority sizes="(max-width: 800px) 100vw, 47vw" className="pediatron-hero-photo" />
            <div className="pediatron-mentor-tag"><Stethoscope aria-hidden="true" /><span><strong>Dr. Aristóteles Pires</strong><small>Experiência clínica e educação médica</small></span></div>
          </div>
        </div>
        <div className="pediatron-hero-bottom" aria-hidden="true" />
      </section>
      <section className="pediatron-solutions" id="solucoes">
        <div className="pediatron-shell">
          <div className="pediatron-section-heading"><span className="pediatron-eyebrow">NOSSO ECOSSISTEMA</span><h2>Três soluções. Um propósito: <em>evoluir juntos.</em></h2><p>Da atualização profissional à troca de experiências, a Pediatron reúne iniciativas que acompanham diferentes momentos da jornada médica.</p></div>
          <div className="pediatron-product-grid">
            <article className="pediatron-product pediatron-product-featured"><span className="pediatron-product-icon"><BookOpenCheck aria-hidden="true"/></span><span className="pediatron-product-type">01 / MENTORIA</span><h3>Ped Expert Mentory</h3><p>Mentoria online semanal com o Dr. Aristóteles Pires, análise de casos reais e conteúdo para aprofundar o raciocínio clínico.</p><ul><li>Encontros online semanais</li><li>Discussão educacional de casos</li><li>Aprendizado com experiência prática</li></ul><Link href="/ped-expert-mentory" className="pediatron-product-link">Conheça a mentoria <ArrowRight aria-hidden="true"/></Link></article>
            <article className="pediatron-product"><span className="pediatron-product-icon"><MessageCircle aria-hidden="true"/></span><span className="pediatron-product-type">02 / COMUNIDADE</span><h3>Comunidade no WhatsApp</h3><p>Um espaço de conexão entre profissionais para compartilhar conhecimento, experiências e discussões de educação médica.</p><ul><li>Troca entre profissionais</li><li>Conteúdos e conversas da comunidade</li><li>Conexão com o ecossistema Pediatron</li></ul><Link href="/lancamento_mentoria#inscricao" className="pediatron-product-link">Conheça o grupo de lançamento <ArrowRight aria-hidden="true"/></Link><small className="pediatron-product-note">O grupo gratuito de lançamento é diferente da comunidade fechada.</small></article>
            <article className="pediatron-product"><span className="pediatron-product-icon"><HeartPulse aria-hidden="true"/></span><span className="pediatron-product-type">03 / FERRAMENTA DIGITAL</span><h3>Folha PCR</h3><p>Uma folha digital de consulta para organizar informações de via aérea, medicações e desfibrilação na rotina da emergência pediátrica.</p><ul><li>Consulta organizada por etapas</li><li>Interface para desktop e celular</li><li>Opções de impressão e PDF</li></ul><Link href="/folha-pcr" className="pediatron-product-link">Conheça a Folha PCR <ArrowRight aria-hidden="true"/></Link></article>
          </div>
        </div>
      </section>
      <section className="pediatron-specialist" id="especialista"><div className="pediatron-shell pediatron-specialist-grid"><div className="pediatron-specialist-photo"><Image src="/images/dr-aristoteles-pires.png" alt="Dr. Aristóteles Pires" fill sizes="(max-width: 800px) 90vw, 36vw" /></div><div><span className="pediatron-eyebrow">EXPERIÊNCIA QUE INSPIRA</span><h2>Dr. Aristóteles Pires: conhecimento construído na prática.</h2><p>Com 28 anos de carreira, o Dr. Aristóteles Pires reúne experiência em Pediatria e formação acadêmica em Pediatria e Telemedicina. Sua atuação contribui para conectar educação médica, tecnologia e os desafios reais da assistência.</p><div className="pediatron-specialist-facts"><span><strong>28+</strong><small>anos de carreira</small></span><span><CalendarDays aria-hidden="true"/><small>Mentoria semanal</small></span></div><a className="pediatron-social" href="https://www.instagram.com/dr.aristotelespires/" target="_blank" rel="noopener noreferrer"><Instagram aria-hidden="true"/> @dr.aristotelespires <ArrowRight aria-hidden="true"/></a></div></div></section>
      <section className="pediatron-about" id="sobre"><div className="pediatron-shell pediatron-about-inner"><span className="pediatron-eyebrow">SOBRE A PEDIATRON</span><h2>Mais do que produtos. Um ecossistema para quem cuida.</h2><p>Unimos educação continuada, conexões profissionais e recursos digitais para apoiar o desenvolvimento de médicos que atuam com crianças. Cada solução tem seu papel; todas compartilham o compromisso com uma prática informada e responsável.</p><a className="pediatron-btn pediatron-btn-primary" href="#solucoes">Conheça nossas soluções <ArrowRight aria-hidden="true"/></a></div></section>
      <footer className="pediatron-footer"><div className="pediatron-shell pediatron-footer-inner"><span className="pediatron-wordmark">PEDIATRON<span className="pediatron-wordmark-dot">.</span></span><p>Educação médica e recursos de apoio. As soluções não substituem protocolos institucionais nem decisões clínicas individualizadas.</p><nav aria-label="Links do rodapé"><Link href="/ped-expert-mentory">Mentory</Link><Link href="/folha-pcr">Folha PCR</Link><Link href="/lancamento_mentoria">Lançamento</Link></nav></div></footer>
    </main>
  );
}
