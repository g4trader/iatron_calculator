'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, ArrowUpRight } from 'lucide-react';
import type { CommunityConfig } from '@/lib/mentory/community-validation';

async function post(path: string, body: unknown) {
  const response = await fetch(`/api/mentory/community/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Não foi possível concluir. Tente novamente.');
  return result;
}
export function CommunityJoin() {
  const [accepted, setAccepted] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  return <form className="community-join" onSubmit={async event => {
    event.preventDefault(); if (!accepted || busy) return; setBusy(true); setError('');
    try { const result = await post('join', { accepted: true }); window.location.assign(result.url); }
    catch (e) { setError(e instanceof Error ? e.message : 'Verifique sua conexão e tente novamente.'); setBusy(false); }
  }}><label className="community-consent"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} required/>Li as orientações de convivência e entendo que a conversa acontece no WhatsApp.</label><button className="btn btn-primary" disabled={!accepted || busy}><MessageCircle size={18} aria-hidden="true"/>{busy ? 'Abrindo WhatsApp…' : 'Entrar na comunidade'}<ArrowUpRight size={18} aria-hidden="true"/></button>{error && <p role="alert" className="field-error">{error}</p>}</form>;
}
export function CommunitySettingsForm({ initial }: { initial: { config: CommunityConfig; version: string | null } }) {
  const router = useRouter(); const [config, setConfig] = useState(initial.config); const [version, setVersion] = useState(initial.version);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const update = (patch: Partial<CommunityConfig>) => { setConfig({ ...config, ...patch }); setMessage(''); };
  return <form className="account-form community-settings" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { const saved = await post('settings', { config, version }); setConfig(saved.config); setVersion(saved.version); setMessage('Configuração da comunidade salva.'); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Verifique sua conexão.'); } finally { setBusy(false); }
  }}><label>Mensagem de boas-vindas<textarea rows={4} minLength={10} maxLength={800} required value={config.welcome} onChange={e => update({ welcome: e.target.value })}/></label><label>Convite da comunidade no WhatsApp<input type="url" placeholder="https://chat.whatsapp.com/…" autoComplete="off" value={config.inviteUrl} onChange={e => update({ inviteUrl: e.target.value })} maxLength={300} required={config.enabled}/></label><p>Use o convite da comunidade fechada. Ao redefinir o convite no WhatsApp, substitua também este endereço.</p><label>WhatsApp de suporte ao acesso (opcional)<input type="tel" inputMode="numeric" autoComplete="off" placeholder="55 + DDD + número" value={config.supportPhone} onChange={e => update({ supportPhone: e.target.value })} pattern="[1-9][0-9]{9,14}" maxLength={15}/></label><p>Contato da equipe para problemas de entrada, exibido também a alunos sem acesso ativo.</p><label className="community-consent"><input type="checkbox" checked={config.enabled} onChange={e => update({ enabled: e.target.checked })}/>Liberar convite para alunos com mentoria ativa</label><button className="btn btn-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar comunidade'}</button>{error && <p role="alert" className="field-error">{error}</p>}<p role="status">{message}</p></form>;
}
