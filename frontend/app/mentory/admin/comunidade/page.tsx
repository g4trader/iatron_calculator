import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Shell from '@/components/mentory/Shell';
import Link from '@/components/mentory/NavigationLink';
import { CommunitySettingsForm } from '@/components/mentory/Community';
import { pageIdentity } from '@/lib/mentory/server';
import { communitySettings } from '@/lib/mentory/community';
import { COMMUNITY_PRODUCT } from '@/lib/mentory/community-validation';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Gestão da comunidade | MENTOR.iatron' };
export default async function CommunityAdminPage() {
  const actor = await pageIdentity(true); if (!actor.admin) redirect('/mentory/admin');
  const [settings, invitations] = await Promise.all([
    communitySettings(),
    prisma.mentoryAuditLog.findMany({ where: { entityId: COMMUNITY_PRODUCT, action: 'community.invite.opened' }, orderBy: { timestamp: 'desc' }, take: 30, select: { id: true, timestamp: true, actor: { select: { name: true, email: true } } } }),
  ]);
  return <Shell editor admin name={actor.name} email={actor.email}><header className="page-heading"><span className="eyebrow">RELACIONAMENTO COM OS ALUNOS</span><h1>Gestão da comunidade</h1><p>Configure o bônus da mentoria e o canal de suporte ao acesso.</p></header><div className="community-layout"><section className="panel"><h2>Comunidade no WhatsApp</h2><CommunitySettingsForm initial={settings}/></section><aside className="community-access"><section className="panel"><h2>Benefício da mentoria</h2><p>O convite é liberado somente para alunos com matrícula e assinatura ativas. Administradores e editores não recebem acesso de aluno automaticamente.</p><p>A comunidade tem uma regra de acesso própria, preparada para uma futura oferta independente. Nenhuma venda ou cobrança foi habilitada.</p><Link className="btn btn-outline" href="/mentory/comunidade">Ver página do aluno</Link></section><section className="panel"><h2>Gestão dos grupos</h2><p>A equipe administra os participantes no WhatsApp. Ative a aprovação de novos membros nos grupos fechados e confira a matrícula antes de admitir cada aluno.</p><p>Quando a mentoria expira, o portal deixa de liberar o convite. A equipe precisa remover o participante no WhatsApp: essa ação não é automática.</p><p>Pausar o acesso aqui não invalida convites já copiados. Para isso, redefina o link no WhatsApp e atualize esta configuração.</p></section></aside></div><section className="panel community-history"><h2>Últimos convites abertos</h2><p>Até 30 aberturas recentes. Este registro indica a liberação do convite, não confirma entrada ou participação no WhatsApp.</p>{invitations.length ? <ul>{invitations.map(entry => <li key={entry.id}><div><strong>{entry.actor?.name || 'Aluno'}</strong><span>{entry.actor?.email || 'Conta removida'}</span>{entry.actor?.email && <Link className="community-admin-link" href={`/mentory/admin/assinaturas?q=${encodeURIComponent(entry.actor.email)}`}>Conferir assinatura →</Link>}</div><time dateTime={entry.timestamp.toISOString()}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(entry.timestamp)}</time></li>)}</ul> : <p>Nenhum convite aberto pela plataforma ainda.</p>}</section></Shell>;
}
