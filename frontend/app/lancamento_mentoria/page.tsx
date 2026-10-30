'use client';
import { useState, type FormEvent } from 'react';

const GROUP_URL = 'https://chat.whatsapp.com/IZfXGWubm5gKO9baqP2lWa?s=sw&p=i&mlu=4&ilr=4&iam=2';

export default function LancamentoMentoria() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
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
          ...Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].map(k => [k, params.get(k) || undefined])),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) throw new Error(data.error || 'Não foi possível concluir seu cadastro. Tente novamente.');
      setComplete(true);
      window.location.assign(GROUP_URL);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    } finally { setPending(false); }
  }
  return <main className="mentoria-lp">
    <style>{`
      .mentoria-lp{min-height:100dvh;background:#f5f5ee;color:#193b30;font-family:Arial,Helvetica,sans-serif;padding:26px 20px 50px}
      .mentoria-lp *{box-sizing:border-box}.mentoria-shell{max-width:1100px;margin:auto}.mentoria-brand{font-family:Georgia,serif;font-size:27px;letter-spacing:-1px;font-weight:700}
      .mentoria-brand span{font:500 11px Arial,sans-serif;letter-spacing:2px;margin-left:12px;color:#57746a}
      .mentoria-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:70px;align-items:center;padding:90px 0 55px}
      .mentoria-eyebrow{font-size:12px;font-weight:700;letter-spacing:2.3px;text-transform:uppercase;color:#628274}
      .mentoria-title{font:normal clamp(43px,5.2vw,76px)/1.07 Georgia,serif;letter-spacing:-2px;margin:22px 0}
      .mentoria-intro{font-size:18px;line-height:1.65;max-width:540px;color:#47665a}
      .mentoria-benefits{display:grid;gap:18px;margin-top:36px}.mentoria-benefit{display:flex;gap:14px;align-items:start;font-size:15px;line-height:1.5}
      .mentoria-tick{background:#dbe7dc;color:#245943;border-radius:50%;width:28px;height:28px;flex:none;display:grid;place-items:center;font-weight:700}
      .mentoria-card{background:white;border:1px solid #e1e8df;border-radius:20px;padding:36px;box-shadow:0 18px 55px #1d453115}
      .mentoria-card h2{font:normal 34px Georgia,serif;margin:0 0 10px}.mentoria-card p{color:#61756c;line-height:1.5;margin:0 0 24px}
      .mentoria-card label:not(.mentoria-consent){display:block;font-size:13px;font-weight:700;margin:15px 0 7px}
      .mentoria-card input:not([type=checkbox]){width:100%;border:1px solid #cbd8cf;border-radius:9px;padding:15px 14px;font:inherit;outline-offset:2px;background:white;color:#18382e}
      .mentoria-consent{display:flex;align-items:flex-start;gap:10px;font-size:12px;line-height:1.55;color:#51675c;margin:22px 0}
      .mentoria-consent input{margin-top:3px;accent-color:#245943}
      .mentoria-cta{width:100%;background:#205c43;color:white;border:0;border-radius:10px;padding:18px 15px;font-weight:700;font-size:15px;cursor:pointer}
      .mentoria-cta:hover{background:#164832}.mentoria-cta:disabled{opacity:.6;cursor:wait}
      .mentoria-error{color:#a12626;font-size:13px;margin:12px 0}.mentoria-foot{text-align:center;font-size:12px;color:#72867b;margin-top:25px}
      .mentoria-footer{border-top:1px solid #d9e2d8;padding-top:24px;color:#708379;font-size:12px}
      @media(max-width:800px){.mentoria-grid{grid-template-columns:1fr;gap:28px;padding:45px 0}.mentoria-title{font-size:clamp(40px,10vw,60px)}.mentoria-card{padding:25px}.mentoria-benefits{margin-top:24px}}
    `}</style>
    <div className="mentoria-shell">
      <header className="mentoria-brand">iatron <span>MENTORIA MÉDICA</span></header>
      <div className="mentoria-grid">
        <section aria-labelledby="mentoria-title">
          <div className="mentoria-eyebrow">Comunidade de lançamento</div>
          <h1 id="mentoria-title" className="mentoria-title">Sua carreira médica merece boa orientação.</h1>
          <p className="mentoria-intro">Entre na comunidade de lançamento da Mentoria Iatron. Acompanhe novidades, conteúdos e conversas sobre residência médica, preparação e desenvolvimento profissional.</p>
          <div className="mentoria-benefits">
            <div className="mentoria-benefit"><span className="mentoria-tick">✓</span><span>Conteúdos e orientações sobre preparação para residência.</span></div>
            <div className="mentoria-benefit"><span className="mentoria-tick">✓</span><span>Novidades sobre o lançamento da mentoria.</span></div>
            <div className="mentoria-benefit"><span className="mentoria-tick">✓</span><span>Uma comunidade para acompanhar essa jornada.</span></div>
          </div>
        </section>
        <section className="mentoria-card" aria-labelledby="mentoria-form-title">
          <h2 id="mentoria-form-title">Entre para a comunidade</h2>
          <p>Preencha seus dados para receber o acesso ao grupo de WhatsApp.</p>
          <form onSubmit={submit}>
            <label htmlFor="mentoria-name">Nome completo</label>
            <input id="mentoria-name" name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Seu nome completo"/>
            <label htmlFor="mentoria-phone">WhatsApp com DDD</label>
            <input id="mentoria-phone" name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999"/>
            <label htmlFor="mentoria-email">E-mail</label>
            <input id="mentoria-email" name="email" required type="email" autoComplete="email" placeholder="voce@exemplo.com"/>
            <div style={{display:'none'}} aria-hidden="true"><label htmlFor="mentoria-website">Website</label><input id="mentoria-website" name="website" tabIndex={-1} autoComplete="off"/></div>
            <label className="mentoria-consent"><input type="checkbox" name="consent" required/><span>Concordo com o uso dos meus dados para inscrição e contato sobre a Mentoria Iatron, conforme a Política de Privacidade da Iatron.</span></label>
            {error && <div role="alert" className="mentoria-error">{error}</div>}
            <button className="mentoria-cta" type="submit" disabled={pending || complete}>{pending ? 'Confirmando inscrição...' : complete ? 'Inscrição enviada' : 'QUERO ENTRAR NA COMUNIDADE'}</button>
            {complete && <p>Se o WhatsApp não abrir automaticamente, <a href={GROUP_URL}>abra o grupo aqui</a>.</p>}
            <div className="mentoria-foot">Cadastro gratuito. O ingresso no grupo depende das configurações do WhatsApp.</div>
          </form>
        </section>
      </div>
      <footer className="mentoria-footer">© Iatron EdTech · Comunidade de lançamento da mentoria</footer>
    </div>
  </main>;
}
