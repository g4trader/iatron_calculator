'use client';
import { useState, type FormEvent } from 'react';

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
      .pediatron .nav{background:#fff;border-bottom:1px solid #e1ebf3}.pediatron .navin{min-height:75px;display:flex;align-items:center;justify-content:space-between;gap:18px}
      .pediatron .logo{font-size:23px;color:#006ba7;font-weight:800;letter-spacing:-.5px}.pediatron .product-name{font-size:24px;color:#103a58;font-weight:900;letter-spacing:.5px;margin-left:8px}
      .pediatron .navlinks{display:flex;gap:22px;font-size:13px}.pediatron .navlinks a{color:#34536d}
      .pediatron .btn{display:inline-flex;align-items:center;justify-content:center;background:#006ca9;color:#fff;border:0;border-radius:9px;padding:15px 20px;font-weight:700;font-size:14px;cursor:pointer;text-align:center}
      .pediatron .btn.light{background:#fff;color:#006ca9}.pediatron .btn.outline{background:#fff;color:#006ca9;border:1px solid #c3deed}
      .pediatron .eyebrow{font-size:11px;letter-spacing:1.3px;text-transform:uppercase;color:#0077aa;font-weight:800}
      .pediatron h1{font-size:clamp(36px,4.6vw,57px);line-height:1.08;letter-spacing:-2px;margin:18px 0}
      .pediatron h2{font-size:clamp(27px,3vw,38px);line-height:1.18;letter-spacing:-1px;margin:12px 0 18px}
      .pediatron h3{font-size:17px;margin:14px 0 9px}.pediatron p{font-size:15px;color:var(--muted);line-height:1.7}
      .pediatron .hero{background:linear-gradient(115deg,#f1faff,#dceffa);padding:70px 0}
      .pediatron .hero-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:55px;align-items:center}
      .pediatron .lead{font-size:17px}.pediatron .actions{display:flex;flex-wrap:wrap;gap:12px;margin:27px 0}
      .pediatron .ticks{display:flex;gap:16px;flex-wrap:wrap;color:#4c6980;font-size:12px}
      .pediatron .portrait{background:linear-gradient(150deg,#144668,#0c2d49);border-radius:22px;min-height:390px;display:flex;flex-direction:column;justify-content:end;padding:28px;box-shadow:0 22px 48px #1a5b8130;color:white}
      .pediatron .mentor-photo{width:100%;height:100%;object-fit:cover;object-position:center top;display:block}.pediatron .portrait{overflow:hidden;position:relative}.pediatron .portrait .mentor-photo{position:absolute;inset:0;opacity:.88}.pediatron .portrait strong,.pediatron .portrait p{position:relative;z-index:1;text-shadow:0 2px 8px #06253c}.pediatron .portrait:after{content:"";position:absolute;inset:45% 0 0;background:linear-gradient(transparent,#092e4b);pointer-events:none}.pediatron .portrait strong{font-size:23px}.pediatron .portrait p{color:#c7e3f2;margin-bottom:0;font-size:13px}
      .pediatron .section{padding:75px 0}.pediatron .alt{background:#f5f9fc}.pediatron .pale{background:#eaf6fd}
      .pediatron .intro{max-width:760px}.pediatron .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:17px;margin-top:30px}
      .pediatron .card{border:1px solid var(--line);background:white;border-radius:13px;padding:25px;box-shadow:0 7px 19px #1c4b6710}
      .pediatron .card .icon{width:39px;height:39px;display:grid;place-items:center;background:#e2f3ff;color:#006ca9;border-radius:10px;font-size:20px;font-weight:bold}
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
      @media(max-width:800px){.pediatron .navlinks{display:none}.pediatron .hero-grid,.pediatron .launch-grid,.pediatron .mentor-grid{grid-template-columns:1fr}.pediatron .cards,.pediatron .steps{grid-template-columns:1fr 1fr}}
      @media(max-width:540px){.pediatron .wrap{padding:0 19px}.pediatron .hero{padding:48px 0}.pediatron .section,.pediatron .launch{padding:50px 0}.pediatron .cards,.pediatron .steps,.pediatron .fields{grid-template-columns:1fr}.pediatron .navin .btn{font-size:11px;padding:12px}.pediatron .logo{font-size:18px}.pediatron .product-name{font-size:20px}.pediatron .portrait{min-height:280px}}
    `}</style>
    <div className="ribbon">Aula inaugural gratuita • 14 de novembro, às 19h • Condições de lançamento somente no WhatsApp</div>
    <header className="nav"><div className="wrap navin"><a href="#" className="logo">Ped Expert <strong className="product-name">Mentory</strong></a><nav className="navlinks"><a href="#programa">Programa</a><a href="#mentor">Mentor</a><a href="#novembro">Lançamento</a><a href="#perguntas">Dúvidas</a></nav><a className="btn" href="#inscricao">Entrar no grupo →</a></div></header>
    <section className="hero"><div className="wrap hero-grid"><div><div className="eyebrow">Ped Expert Mentory • Urgência pediátrica</div><h1>Mais preparo para os desafios dos primeiros plantões pediátricos.</h1><p className="lead">Seis meses de desenvolvimento profissional com o Dr. Aristóteles Pires, com <strong>encontros ao vivo semanais</strong>, aulas gravadas e uma comunidade de médicos.</p><div className="actions"><a className="btn" href="#inscricao">Quero participar do lançamento →</a><a className="btn outline" href="#programa">Conhecer o programa</a></div><div className="ticks"><span>✓ 6 meses</span><span>✓ Aulas semanais</span><span>✓ Grupo de lançamento gratuito</span></div></div><div className="portrait" role="img" aria-label="Área reservada para fotografia oficial do Dr. Aristóteles Pires"><img src="/dr-aristoteles-pires.svg" alt="Dr. Aristóteles Pires" className="mentor-photo"/><strong>Dr. Aristóteles Pires</strong><p>Especialista em Pediatria • 28 anos de experiência</p></div></div></section>
    <section id="programa" className="section"><div className="wrap"><div className="intro"><div className="eyebrow">A mentoria</div><h2>Aprendizado contínuo para a prática em urgência pediátrica.</h2><p>Para médicos recém-formados e em início de carreira que desejam aprofundar o raciocínio clínico e discutir situações comuns dos plantões pediátricos com orientação educacional experiente.</p></div><div className="cards">{benefits.map(([title, description], index) => <article className="card" key={title}><div className="icon">{['◷','▷','♧','✚','▤','↻'][index]}</div><h3>{title}</h3><p>{description}</p></article>)}</div></div></section>
    <section id="mentor" className="section alt"><div className="wrap mentor-grid"><div className="mentor-art"><img src="/dr-aristoteles-pires.svg" alt="Dr. Aristóteles Pires" className="mentor-photo"/></div><div><div className="eyebrow">Quem acompanha você</div><h2>Aprenda com a experiência do Dr. Aristóteles Pires.</h2><p>Especialista em Pediatria, com 28 anos de carreira e doutorado em Pediatria e Telemedicina. Na Ped Expert Mentory, conduz encontros coletivos semanais e compartilha sua experiência profissional.</p><div className="stats"><div><b>28</b><span>anos de carreira</span></div><div><b>6</b><span>meses por ciclo</span></div><div><b>1×</b><span>encontro por semana</span></div></div></div></div></section>
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
