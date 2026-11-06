import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import Shell from '@/components/mentory/Shell';
import Admin, { AdminData } from '@/components/mentory/Admin';
import { pageIdentity, adminData, type Identity } from '@/lib/mentory/server';
export const dynamic = 'force-dynamic';
async function AdminContent({ actor, filter, section }: { actor: Identity; filter: { query: string; status: string; page: number }; section: string }) {
  const data = JSON.parse(JSON.stringify(await adminData(actor, filter, section))) as AdminData;
  return <Admin data={data} section={section} admin={actor.admin}/>;
}
export default async function AdminPage({ params, searchParams }: { params: Promise<{ section?: string[] }>; searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const actor = await pageIdentity(true); const parts = (await params).section || []; const section = parts.join('/');
  if (!['', 'conteudo', 'alunos', 'assinaturas'].includes(section)) notFound();
  if (['alunos', 'assinaturas'].includes(section) && !actor.admin) redirect('/mentory/admin');
  const search = await searchParams;
  const filter = { query: (search.q || '').slice(0, 200), status: search.status || '', page: Math.max(1, Math.min(100000, Number.parseInt(search.page || '1', 10) || 1)) };
  return <Shell editor admin={actor.admin} name={actor.name} email={actor.email}><div className="page-heading"><span className="eyebrow">ADMINISTRAÇÃO Ped Expert Mentory</span><h1>{{ '': 'Visão geral', conteudo: 'Gestão de conteúdo', alunos: 'Gestão de alunos', assinaturas: 'Assinaturas' }[section]}</h1><p>Organize a experiência de aprendizagem com segurança.</p></div><Suspense fallback={<div className="panel" aria-busy="true"><p role="status">Carregando dados…</p></div>}><AdminContent actor={actor} filter={filter} section={section}/></Suspense></Shell>;
}
