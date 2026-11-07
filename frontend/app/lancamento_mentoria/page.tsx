'use client';
import { useState, type FormEvent } from 'react';
import { MentoryIcon } from '@/components/mentory/MentoryIcon';
import '../ped-expert-mentory/brand-landing.css';

const GROUP_URL = 'https://chat.whatsapp.com/IZfXGWubm5gKO9baqP2lWa?s=sw&p=i&mlu=4&ilr=4&iam=2';

const benefits = [
  ['Encontros ao vivo semanais', 'Sessões coletivas com o Dr. Aristóteles para aprofundamento de temas e discussão educacional de dúvidas.'],
  ['Aulas gravadas', 'Conteúdos organizados para complementar os encontros e permitir revisões durante o ciclo.'],
  ['Comunidade Fechada Iatron', 'Seis meses de acesso à comunidade premium, com regras de participação e confidencialidade.'],
  ['Folha PCR', 'Doze meses de acesso ao recurso, conforme suas condições de utilização.'],
  ['Materiais complementares', 'Recursos educacionais de apoio à preparação e às discussões.'],
  ['Possibilidade de continuidade', 'Duas renovações semestrais previstas com preservação do valor nominal de ingresso, conforme contrato.'],
];

export default function LancamentoMentoria() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || complete) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const params = new URLSearchParams(window.location.search);
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/mentoria/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.get('name'),
          phone: values.get('phone'),
          email: values.get('email'),
          consent: values.get('consent') === 'on',
          website: values.get('website') || '',
          ...Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].map(k => [k, params.get(k) || undefined])),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) throw new Error(data.error || 'Não foi possível concluir seu cadastro. Tente novamente.');
      setComplete(true);
      window.location.assign(GROUP_URL);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setPending(false);
    }
  }

  return <main className="pediatron">
    <style>{`
      .pediatron{--ink:#112f4b;--blue:#006ca9;--muted:#526c83;--line:#dce8f1;font-family:Arial,Helvetica,sans-serif;color:var(--ink);background:white;min-height:100vh}
      .pediatron *{box-sizing:border-box}.pediatron a{text-decoration:none}.pediatron .wrap{max-width:1120px;margin:auto;padding:0 25px}
      .pediatron .ribbon{background:#0c3454;color:#e3f3fc;text-align:center;padding:11px;font-size:12px}
      .pediatron .nav{background:#05243e;border-bottom:1px solid #134762}.pediatron .navlinks a{color:#e1eff8}.pediatron .nav .logo{color:white}.pediatron .nav .product-name{color:#0be0e0}.pediatron .nav .btn{background:#0be0e0;color:#05243e;border-radius:99px}.pediatron .navin{min-height:75px;display:flex;align-items:center;justify-content:space-between;gap:18px}
      .pediatron .logo{font-size:23px;color:#006ba7;font-weight:800;letter-spacing:-.5px}.pediatron .product-name{font-size:24px;color:#103a58;font-weight:900;letter-spacing:.5px;margin-left:8px}
      .pediatron .navlinks{display:flex;gap:22px;font-size:13px}.pediatron .navlinks a{color:#e1eff8}
      .pediatron .btn{display:inline-flex;align-items:center;justify-content:center;background:#006ca9;color:#fff;border:0;border-radius:9px;padding:15px 20px;font-weight:700;font-size:14px;cursor:pointer;text-align:center}
      .pediatron .btn.light{background:#fff;color:#006ca9}.pediatron .btn.outline{background:#fff;color:#006ca9;border:1px solid #c3deed}
      .pediatron .eyebrow{font-size:11px;letter-spacing:1.3px;text-transform:uppercase;color:#0077aa;font-weight:800}
      .pediatron h1{font-size:clamp(36px,4.6vw,57px);line-height:1.08;letter-spacing:-2px;margin:18px 0}
      .pediatron h2{font-size:clamp(27px,3vw,38px);line-height:1.18;letter-spacing:-1px;margin:12px 0 18px}
      .pediatron h3{font-size:17px;margin:14px 0 9px}.pediatron p{font-size:15px;color:var(--muted);line-height:1.7}
      .pediatron .hero{background:radial-gradient(ellipse at 78% 50%,#087a9f 0%,#073c60 37%,#05243e 75%);padding:60px 0 0;overflow:hidden;color:#fff}.pediatron .hero h1{color:#fff;font-size:clamp(42px,5vw,66px);font-weight:900;line-height:1.08}.pediatron .hero .lead{color:#e0eef6;font-size:18px}.pediatron .hero .eyebrow{color:#17e1e4}.pediatron .hero .btn{border-radius:99px;background:#0be0e0;color:#062c47}.pediatron .hero .btn.outline{background:transparent;border:1px solid #d0e9f5;color:#fff}.pediatron .hero .ticks{color:#cde6f2}.pediatron .hero-grid{min-height:570px;grid-template-columns:1.05fr .95fr;gap:18px}.pediatron .hero-grid>div:first-child{position:relative;z-index:3;padding-bottom:50px}
      .pediatron .hero-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:55px;align-items:center}
      .pediatron .lead{font-size:17px}.pediatron .actions{display:flex;flex-wrap:wrap;gap:12px;margin:27px 0}
      .pediatron .ticks{display:flex;gap:16px;flex-wrap:wrap;color:#4c6980;font-size:12px}
      .pediatron .portrait{background:transparent;border-radius:0;min-height:570px;display:flex;flex-direction:column;justify-content:end;padding:28px;box-shadow:none;color:white;isolation:isolate}.pediatron .portrait:before{content:"";position:absolute;inset:15% 2% 0 8%;border-radius:48%;transform:rotate(22deg);background:linear-gradient(145deg,#04e0db,#0074b4,#06395f);z-index:-1}
      .pediatron .mentor-photo{width:100%;height:100%;object-fit:cover;object-position:center top;display:block}.pediatron .portrait{overflow:hidden;position:relative}.pediatron .portrait .mentor-photo{position:absolute;inset:0;opacity:1;object-position:center 15%;mask-image:linear-gradient(to bottom,#000 65%,transparent 100%)}.pediatron .portrait strong,.pediatron .portrait p{display:none}.pediatron .portrait:after{content:"";position:absolute;inset:72% 0 0;background:linear-gradient(transparent,#05243e);pointer-events:none}.pediatron .portrait strong{font-size:23px}.pediatron .portrait p{color:#c7e3f2;margin-bottom:0;font-size:13px}
      .pediatron .section{padding:75px 0}.pediatron .alt{background:#f5f9fc}.pediatron .pale{background:#eaf6fd}
      .pediatron .intro{max-width:760px}.pediatron .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:17px;margin-top:30px}
      .pediatron .card{border:1px solid var(--line);background:white;border-radius:13px;padding:25px;box-shadow:0 7px 19px #1c4b6710}
      .pediatron .card .icon{width:44px;height:44px;display:grid;place-items:center;background:#e2f3ff;color:#006ca9;border-radius:12px}.pediatron .card .icon svg{width:26px;height:26px}
      .pediatron .card p{font-size:13px;margin-bottom:0}
      .pediatron .mentor-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:40px;align-items:center}
      .pediatron .mentor-art{overflow:hidden;height:320px;min-height:270px;border-radius:18px;background:linear-gradient(140deg,#0e4265,#0878a4);display:grid;place-items:center;color:#d8effb;font-size:76px}
      .pediatron .stats{display:flex;flex-wrap:wrap;gap:25px}.pediatron .stats b{display:block;font-size:27px;color:#006ca9}.pediatron .stats span{font-size:12px;color:#58738a}
      .pediatron .launch{background:#0c3656;color:#fff;padding:75px 0}.pediatron .launch-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:45px;align-items:center}
      .pediatron .launch h2{color:#fff}.pediatron .launch p{color:#c6dce9}.pediatron .launch .eyebrow{color:#8edcff}
      .pediatron .agenda{border:1px solid #46738c;border-radius:16px;padding:28px;background:#164867}.pediatron .agenda .date{font-size:39px;font-weight:800}
      .pediatron .agenda hr{border:0;border-top:1px solid #4d7791;margin:20px 0}.pediatron .agenda b{color:white}
      .pediatron .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px}
      .pediatron .step{border:1px solid var(--line);border-radius:13px;padding:25px}.pediatron .step b{font-size:29px;color:#0070ad}
      .pediatron .faq{border-bottom:1px solid var(--line);padding:18px 0}.pediatron .faq p{font-size:13px;margin:7px 0 0}
      .pediatron .formbox{max-width:700px;margin:auto;border:1px solid #d5e5ef;border-radius:18px;background:#fff;padding:34px;box-shadow:0 15px 35px #15496812}
      .pediatron .fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pediatron .fields label{font-size:13px;font-weight:700}
      .pediatron .fields input{width:100%;padding:13px;border:1px solid #c6d9e7;border-radius:8px;margin-top:7px;font:inherit}
      .pediatron .fields .full{grid-column:1/-1}.pediatron .consent{display:flex;align-items:start;gap:10px;margin:20px 0;color:#536e84;font-size:12px;line-height:1.6}
      .pediatron .consent input{margin-top:3px}.pediatron .error{color:#a02d2d;font-size:13px}
      .pediatron .foot{background:#092e4a;color:#c9deeb;padding:30px 0;font-size:12px}
      @media(max-width:800px){.pediatron .navlinks{display:none}.pediatron .hero-grid,.pediatron .launch-grid,.pediatron .mentor-grid{grid-template-columns:1fr}.pediatron .hero .portrait{min-height:380px}.pediatron .hero-grid>div:first-child{padding-bottom:0}.pediatron .cards,.pediatron .steps{grid-template-columns:1fr 1fr}}
      .pediatron .launch-brand{font-family:Arial,Helvetica,sans-serif}
      .pediatron .launch-brand .mentory-dark-shell{background:radial-gradient(ellipse at 76% 51%,#05648b 0%,#063a5a 33%,#042741 65%,#031b32 100%)}
      .pediatron .launch-brand .mentory-hero h1{font-size:clamp(39px,4.3vw,61px)!important;line-height:1.1;color:#fff!important;font-weight:900!important;letter-spacing:-2px;margin:0}
      .pediatron .launch-brand .mentory-hero h1 em{color:#04e3e4!important}
      .pediatron .launch-brand .mentory-hero-description{color:#f0f7fc!important;font-size:18px!important;line-height:1.55}
      .pediatron .launch-brand .mentory-eyebrow{color:#04e3e4!important;font-size:15px!important}
      .pediatron .launch-brand .mentory-logo strong{color:#fff!important}
      .pediatron .launch-brand .mentory-logo small{color:#04e3e4!important}
      .pediatron .launch-brand .mentory-cta{color:#05263e!important;background:#04e3e4!important}
      .pediatron .launch-brand .mentory-outline{color:#fff!important}
      .pediatron .launch-brand .mentory-hero-grid{grid-template-columns:55% 45%;gap:0}
      .pediatron .launch-brand-features{background:#f1f8fe;padding:0 20px 38px}
      .pediatron .launch-brand-features>.mentory-container{position:relative;z-index:5;transform:translateY(-36px);margin-bottom:-36px;display:grid;grid-template-columns:repeat(4,1fr);background:#f5fbff;border:1px solid #d6e9f4;border-radius:22px;box-shadow:0 15px 30px #00314c20;padding:26px 18px}
      .pediatron .launch-feature{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;border-right:1px solid #cce3ef;padding:8px 12px;color:#092b42;font-size:15px;line-height:1.35}
      .pediatron .launch-feature:last-child{border:0}.pediatron .launch-feature-icon{width:42px;height:42px;color:#00768e}
      .pediatron .launch-brand-urgency{background:#f1f8fe;padding:0 20px 70px}
      .pediatron .launch-brand-urgency>.mentory-container{background:linear-gradient(110deg,#03456b,#042944);color:white;border-radius:24px;padding:28px 40px;display:grid;grid-template-columns:70px 240px 1fr;align-items:center;gap:24px}
      .pediatron .launch-brand-urgency .launch-rocket{width:58px;height:58px;color:#04e3e4}
      .pediatron .launch-brand-urgency strong{font-size:40px;line-height:1.04;border-right:1px solid #0c92aa;padding-right:25px}
      .pediatron .launch-brand-urgency strong em{display:block;font-style:normal;color:#04e3e4}
      .pediatron .launch-brand-urgency p{color:white;font-size:20px;line-height:1.4}
      @media(max-width:800px){.pediatron .launch-brand .mentory-hero-grid{display:flex;flex-direction:column}.pediatron .launch-brand-features>.mentory-container{grid-template-columns:repeat(2,1fr)}.pediatron .launch-brand-urgency>.mentory-container{grid-template-columns:1fr;text-align:center}.pediatron .launch-brand-urgency strong{border-right:0;padding:0}}
      .pediatron .launch-brand-features{background:#062b47;padding:0 20px 0;border-top:1px solid #ffffff20}
      .pediatron .launch-brand-features>.mentory-container{transform:none;margin-bottom:0;min-height:118px;background:transparent;border:0;border-radius:0;box-shadow:none;padding:22px 10px}
      .pediatron .launch-feature{flex-direction:row;text-align:left;gap:16px;color:#fff;font-size:14px;font-weight:600;border-right:1px solid #1684a0}
      .pediatron .launch-feature-icon{flex:none;width:43px;height:43px;color:#04e3e4}
      .pediatron .launch-brand-urgency{padding:28px 20px 52px}
      .pediatron .launch-brand .mentory-hero-grid{min-height:620px;grid-template-columns:53% 47%}
      .pediatron .launch-brand .mentory-hero-copy{padding:42px 0 80px}
      .pediatron .launch-brand .mentory-hero h1{font-size:clamp(42px,4.3vw,64px)!important}
      @media(max-width:800px){.pediatron .launch-brand .mentory-hero-grid{min-height:0}.pediatron .launch-brand-features>.mentory-container{grid-template-columns:repeat(2,1fr)}.pediatron .launch-feature{font-size:12px;gap:8px}.pediatron .launch-feature-icon{width:31px;height:31px}.pediatron .launch-brand .mentory-hero-copy{padding:45px 0 15px}}
      @media(max-width:540px){.pediatron .wrap{padding:0 19px}.pediatron .hero{padding:48px 0}.pediatron .section,.pediatron .launch{padding:50px 0}.pediatron .cards,.pediatron .steps,.pediatron .fields{grid-template-columns:1fr}.pediatron .navin .btn{font-size:11px;padding:12px}.pediatron .logo{font-size:18px}.pediatron .product-name{font-size:20px}.pediatron .portrait{min-height:280px}}

      .pediatron .launch-menu-toggle,.pediatron .launch-mobile-menu{display:none}
      @media(max-width:800px){
        .pediatron .launch-brand .mentory-nav{position:relative;z-index:30}
        .pediatron .launch-brand .mentory-nav-inner{justify-content:space-between}
        .pediatron .launch-brand .launch-desktop-badge{display:none!important}
        .pediatron .launch-menu-toggle{display:flex;flex-direction:column;justify-content:center;gap:5px;width:46px;height:44px;align-items:center;border:1px solid #64c9df80;border-radius:10px;background:#073954;color:#fff;cursor:pointer;flex:none}
        .pediatron .launch-menu-toggle span{display:block;width:22px;height:2px;background:#04e3e4;border-radius:2px}
        .pediatron .launch-mobile-menu.is-open{display:flex;position:absolute;top:100%;left:0;right:0;flex-direction:column;gap:0;background:#042640;border-top:1px solid #ffffff30;padding:8px 22px 18px;box-shadow:0 18px 25px #00172880;z-index:40}
        .pediatron .launch-mobile-menu a{color:#fff;padding:13px 8px;border-bottom:1px solid #ffffff22;font-size:15px;font-weight:600}
        .pediatron .launch-brand .mentory-hero-copy{padding:36px 0 14px}
        .pediatron .launch-brand .mentory-hero-art{height:440px;min-height:440px;overflow:hidden}
        .pediatron .launch-brand .mentory-hero-portrait{width:min(580px,145vw);height:480px;max-width:none;right:50%;transform:translateX(50%);bottom:-2px;object-fit:contain;object-position:center bottom}
        .pediatron .launch-brand .mentory-hero h1{font-size:clamp(34px,9.4vw,48px)!important;letter-spacing:-1.3px}
        .pediatron .launch-brand-urgency>.mentory-container{grid-template-columns:64px 1fr;gap:12px;text-align:left;padding:24px 20px}
        .pediatron .launch-brand-urgency .launch-rocket{width:56px;height:56px}
        .pediatron .launch-brand-urgency strong{font-size:clamp(29px,8vw,40px);line-height:1.08}
        .pediatron .launch-brand-urgency p{grid-column:1/-1;font-size:15px;margin:8px 0 0;text-align:center}
      }
      @media(max-width:390px){.pediatron .launch-brand .mentory-hero-art{height:390px;min-height:390px}.pediatron .launch-brand .mentory-hero-portrait{height:430px;width:520px}}

      /* Mobile: retrato integrado à própria superfície do hero, sem bloco isolado. */
      @media(max-width:800px){
        .pediatron .launch-brand .mentory-hero{position:relative;isolation:isolate;overflow:hidden;background:radial-gradient(ellipse at 55% 78%,#0b5678 0%,#063c5c 37%,#031b32 78%)}
        .pediatron .launch-brand .mentory-hero::before{content:"";position:absolute;z-index:0;inset:0;pointer-events:none;background-image:linear-gradient(to bottom,#031b32 0%,#031b32ed 14%,#031b3299 38%,transparent 58%,#031b3220 80%,#031b32 100%),url("/images/a_clean_cutout_portrait_on_a_transparent_backgroun.png");background-repeat:no-repeat;background-position:center bottom,center bottom;background-size:100% 100%,auto clamp(390px,110vw,580px)}
        .pediatron .launch-brand .mentory-hero-grid{display:block;min-height:0;position:relative;z-index:1}
        .pediatron .launch-brand .mentory-hero-copy{padding:42px 0 clamp(350px,100vw,510px);max-width:600px}
        .pediatron .launch-brand .mentory-hero-art{display:none!important}
        .pediatron .launch-brand .mentory-hero-description{max-width:440px}
        .pediatron .launch-brand .mentory-actions{position:relative;z-index:2}
      }
      @media(max-width:390px){
        .pediatron .launch-brand .mentory-hero::before{background-size:100% 100%,auto 400px}
        .pediatron .launch-brand .mentory-hero-copy{padding-bottom:360px}
      }

      .pediatron .launch-brand .mentory-hero{position:relative}
      .pediatron .launch-mentor-identity{position:absolute;z-index:6;right:max(5%,calc((100vw - 1120px)/2));bottom:26px;display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:8px;max-width:490px;padding:12px 14px;background:#031b32c9;border:1px solid #4dd8ed66;border-radius:14px;box-shadow:0 8px 25px #00152577;backdrop-filter:blur(9px);color:#fff}
      .pediatron .launch-mentor-identity-item{display:inline-flex;align-items:center;gap:7px;color:#fff;font-size:13px;white-space:nowrap}
      .pediatron .launch-mentor-identity-item svg{width:18px;height:18px;color:#04e3e4;flex:none}
      .pediatron .launch-mentor-instagram{color:#d5f8ff;text-decoration:none}
      .pediatron .launch-mentor-instagram:hover{text-decoration:underline}
      @media(max-width:800px){
        .pediatron .launch-mentor-identity{left:18px;right:18px;bottom:24px;max-width:none;justify-content:center;gap:10px 14px;padding:12px 10px}
        .pediatron .launch-mentor-identity-item{font-size:12px}
        .pediatron .launch-mentor-identity-item svg{width:17px;height:17px}
        .pediatron .launch-brand .mentory-hero-copy{padding-bottom:clamp(400px,112vw,550px)}
      }
      @media(max-width:390px){.pediatron .launch-brand .mentory-hero-copy{padding-bottom:420px}}
    `}</style>
    <div className="ribbon">Aula inaugural gratuita • 14 de novembro, às 19h • Condições de lançamento somente no WhatsApp</div>
    <div className="launch-brand mentory-landing">
      <div className="mentory-dark-shell">
        <header className="mentory-nav">
          <div className="mentory-container mentory-nav-inner">
            <a href="#inicio" className="mentory-logo" aria-label="Ped Expert Mentory">
              <img src="/images/mentory-logo-oficial.png" alt="Ped Expert Mentory"/>
            </a>
            <nav className="mentory-nav-links" aria-label="Navegação da página">
              <a href="#programa">Programa</a><a href="#mentor">Mentor</a><a href="#novembro">Lançamento</a><a href="#perguntas">Dúvidas</a>
            </nav>
            <a href="#inscricao" className="mentory-outline launch-desktop-badge">LANÇAMENTO OFICIAL</a>
            <button type="button" className="launch-menu-toggle" aria-expanded={menuOpen} aria-controls="launch-mobile-menu" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen(!menuOpen)}><span/><span/><span/></button>
          </div>
          <nav id="launch-mobile-menu" className={`launch-mobile-menu${menuOpen ? " is-open" : ""}`} aria-label="Menu mobile">
            <a href="#inicio" onClick={() => setMenuOpen(false)}>Início</a><a href="#programa" onClick={() => setMenuOpen(false)}>Programa</a><a href="#mentor" onClick={() => setMenuOpen(false)}>Mentor</a><a href="#novembro" onClick={() => setMenuOpen(false)}>Lançamento</a><a href="#perguntas" onClick={() => setMenuOpen(false)}>Dúvidas</a><a href="#inscricao" onClick={() => setMenuOpen(false)}>Inscrever-se</a>
          </nav>
        </header>
        <section id="inicio" className="mentory-hero">
          <div className="mentory-container mentory-hero-grid">
            <div className="mentory-hero-copy">
              
              <h1>A mentoria em<br/>Pediatria que conecta<br/><em>evidência, experiência<br/>e prática real.</em></h1>
              <p className="mentory-hero-description">Participe da Ped Expert Mentory e fortaleça sua tomada de decisão clínica com acompanhamento próximo, conteúdo atualizado e discussão de casos.</p>
              <div className="mentory-actions">
                <a href="#inscricao" className="mentory-cta">Quero participar do lançamento <span aria-hidden="true">→</span></a>
                <a href="#novembro" className="mentory-outline">Conheça o lançamento</a>
              </div>
            </div>
            <div className="mentory-hero-art">
              <div className="mentory-wave mentory-wave-back" aria-hidden="true"/>
              <div className="mentory-wave mentory-wave-front" aria-hidden="true"/>
              <img className="mentory-hero-portrait" src="/images/a_clean_cutout_portrait_on_a_transparent_backgroun.png" alt="Dr. Aristóteles Pires"/>
            </div>
          </div>
          <div className="launch-mentor-identity" aria-label="Informações do mentor">
            <span className="launch-mentor-identity-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3v6a6 6 0 0 0 12 0V3"/><path d="M4 3h4M16 3h4"/><path d="M12 15v3a4 4 0 0 0 8 0v-3"/><circle cx="20" cy="13" r="2"/></svg><strong>Dr. Aristóteles Pires</strong></span>
            <span className="launch-mentor-identity-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg><strong>+28a XP</strong></span>
            <a className="launch-mentor-identity-item launch-mentor-instagram" href="https://www.instagram.com/dr.aristotelespires/" target="_blank" rel="noopener noreferrer" aria-label="Instagram do Dr. Aristóteles Pires, @dr.aristotelespires"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.5-2.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"/></svg><span>@dr.aristotelespires</span></a>
          </div>
        </section>
      </div>
      <div className="launch-brand-features">
        <div className="mentory-container">
          <div className="launch-feature"><MentoryIcon name="mentor" className="launch-feature-icon" /><strong>Mentoria online semanal</strong></div>
          <div className="launch-feature"><MentoryIcon name="book" className="launch-feature-icon" /><strong>Análise de casos reais</strong></div>
          <div className="launch-feature"><MentoryIcon name="layers" className="launch-feature-icon" /><strong>Conteúdo atualizado<br/>e aplicável</strong></div>
          <div className="launch-feature"><MentoryIcon name="cases" className="launch-feature-icon" /><strong>Turma limitada<br/>para maior interação</strong></div>
        </div>
      </div>
      <div className="launch-brand-urgency">
        <div className="mentory-container"><MentoryIcon name="rocket" className="launch-rocket" /><strong>Vagas <em>limitadas</em></strong><p>Condições especiais de lançamento por tempo limitado.</p></div>
      </div>
    </div>
    <section id="programa" className="section"><div className="wrap"><div className="intro"><div className="eyebrow">A mentoria</div><h2>Aprendizado contínuo para a prática em urgência pediátrica.</h2><p>Para médicos recém-formados e em início de carreira que desejam aprofundar o raciocínio clínico e discutir situações comuns dos plantões pediátricos com orientação educacional experiente.</p></div><div className="cards">{benefits.map(([title, description], index) => <article className="card" key={title}><div className="icon"><MentoryIcon name={(['calendar','book','cases','shield','layers','award'] as const)[index]} /></div><h3>{title}</h3><p>{description}</p></article>)}</div></div></section>
    <section id="mentor" className="section alt"><div className="wrap mentor-grid"><div className="mentor-art"><img src="/images/dr-aristoteles-pires.png" alt="Dr. Aristóteles Pires" className="mentor-photo"/></div><div><div className="eyebrow">Quem acompanha você</div><h2>Aprenda com a experiência do Dr. Aristóteles Pires.</h2><p>Especialista em Pediatria, com 28 anos de carreira e doutorado em Pediatria e Telemedicina. Na Ped Expert Mentory, conduz encontros coletivos semanais e compartilha sua experiência profissional.</p><div className="stats"><div><b>28</b><span>anos de carreira</span></div><div><b>6</b><span>meses por ciclo</span></div><div><b>1×</b><span>encontro por semana</span></div></div></div></div></section>
    <section id="novembro" className="launch"><div className="wrap launch-grid"><div><div className="eyebrow">Lançamento exclusivo • Novembro de 2026</div><h2>O lançamento acontece dentro do grupo aberto do WhatsApp.</h2><p>Participe da aula inaugural gratuita <strong style={{color:'white'}}>“Do conhecimento à prática: os desafios dos primeiros plantões de urgência pediátrica”</strong> e acompanhe a apresentação da mentoria.</p><p>Os valores promocionais, descontos, vagas por lote e condições comerciais serão revelados <strong style={{color:'white'}}>exclusivamente dentro do grupo aberto</strong>, na abertura das matrículas.</p><a className="btn light" href="#inscricao">Quero entrar no grupo gratuito →</a><p style={{fontSize:12}}>A participação é gratuita e não obriga a contratar.</p></div><div className="agenda"><div className="eyebrow">Agenda de novembro</div><div className="date">14 NOV</div><p><b>19h — Aula inaugural gratuita</b><br/>Encontro educacional com o Dr. Aristóteles.</p><hr/><p><b>20h — Abertura das matrículas</b><br/>Condições do primeiro lote anunciadas no grupo.</p><hr/><p><b>24 NOV • 20h — Encerramento previsto</b><br/>Fechamento programado do lançamento.</p></div></div></section>
    <section className="section pale"><div className="wrap"><div className="intro"><div className="eyebrow">Condições de participação</div><h2>Uma jornada de seis meses. As condições de matrícula serão divulgadas no grupo.</h2><p>A Ped Expert Mentory reúne encontros ao vivo semanais, aulas gravadas, materiais complementares, seis meses de Comunidade Fechada Iatron e doze meses de acesso à Folha PCR. As condições comerciais do lançamento não serão publicadas nesta página.</p><a href="#inscricao" className="btn">Receber informações no WhatsApp →</a></div></div></section>
    <section className="section"><div className="wrap"><div className="eyebrow">Como participar</div><h2>Três passos para acompanhar o lançamento.</h2><div className="steps"><div className="step"><b>01</b><h3>Faça sua inscrição</h3><p>Informe seus dados e autorize o contato sobre o lançamento.</p></div><div className="step"><b>02</b><h3>Entre no grupo aberto</h3><p>Receba orientações e acesso à programação da aula inaugural.</p></div><div className="step"><b>03</b><h3>Acompanhe a abertura</h3><p>Em 14/11, às 20h, as condições comerciais serão divulgadas no grupo.</p></div></div></div></section>
    <section id="perguntas" className="section alt"><div className="wrap" style={{maxWidth:850}}><div className="eyebrow">Perguntas frequentes</div><h2>Informações antes de participar.</h2>{[
      ['Para quem é a mentoria?', 'Para médicos recém-formados e em início de carreira que buscam formação complementar em urgência pediátrica.'],
      ['Os encontros são semanais?', 'Sim. O planejamento prevê encontros coletivos ao vivo toda semana durante cada ciclo de seis meses.'],
      ['Quanto custa?', 'Os valores e as condições comerciais do lançamento serão divulgados exclusivamente no grupo aberto do WhatsApp.'],
      ['O valor da renovação aumenta?', 'Nas duas renovações semestrais previstas, o aluno poderá manter o valor nominal contratado inicialmente, conforme contrato.'],
      ['O grupo aberto é a comunidade premium?', 'Não. O grupo de lançamento é gratuito e temporário. A Comunidade Fechada Iatron é um benefício da mentoria contratada.'],
      ['A mentoria substitui supervisão clínica?', 'Não. A mentoria é educacional e não substitui protocolos, supervisão assistencial ou decisões clínicas individualizadas.']
    ].map(([q,a])=><div className="faq" key={q}><strong>{q}</strong><p>{a}</p></div>)}</div></section>
    <section id="inscricao" className="section pale"><div className="wrap"><div className="formbox"><div className="eyebrow">Inscrição gratuita • Novembro de 2026</div><h2>Entre no grupo de lançamento da Ped Expert Mentory.</h2><p>Cadastre-se para receber o acesso ao grupo aberto do WhatsApp, à aula inaugural e aos comunicados oficiais.</p><form onSubmit={submit}><div className="fields"><label>Nome completo<input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Seu nome"/></label><label>WhatsApp com DDD<input name="phone" type="tel" required autoComplete="tel" placeholder="(11) 99999-9999"/></label><label className="full">E-mail<input name="email" type="email" required autoComplete="email" placeholder="voce@exemplo.com"/></label></div><div style={{display:'none'}} aria-hidden="true"><label htmlFor="ped-website">Website</label><input id="ped-website" name="website" tabIndex={-1} autoComplete="off"/></div><label className="consent"><input type="checkbox" name="consent" required/><span>Autorizo o uso dos meus dados para inscrição e contato sobre a Ped Expert Mentory, conforme a Política de Privacidade da Iatron.</span></label>{error && <p role="alert" className="error">{error}</p>}<button className="btn" type="submit" style={{width:'100%'}} disabled={pending || complete}>{pending?'Confirmando inscrição...':complete?'Inscrição enviada':'Quero entrar no grupo gratuito →'}</button>{complete && <p>Se o WhatsApp não abrir automaticamente, <a href={GROUP_URL}>acesse o grupo aqui</a>.</p>}<p style={{fontSize:12}}>Cadastro gratuito. A entrada no grupo depende das configurações do WhatsApp.</p></form></div></div></section>
    <footer className="foot"><div className="wrap">© Ped Expert Mentory · Formação educacional; não constitui suporte assistencial em tempo real. · PEDIATRON</div></footer>
  </main>;
}
