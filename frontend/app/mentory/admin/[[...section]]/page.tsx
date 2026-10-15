import { notFound, redirect } from 'next/navigation';
import Shell from '@/components/mentory/Shell';
import Admin, { AdminData } from '@/components/mentory/Admin';
import { pageIdentity, adminData } from '@/lib/mentory/server';
export const dynamic = 'force-dynamic';
export default async function AdminPage({ params, searchParams }: { params: Promise<{ section?: string[] }>; searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const actor = await pageIdentity(true); const parts = (await params).section || []; const section = parts.join('/');
  if (!['', 'conteudo', 'alunos', 'assinaturas'].includes(section)) notFound();
  if (['alunos', 'assinaturas'].includes(section) && !actor.admin) redirect('/mentory/admin');
  const search = await searchParams;
  const filter = { query: (search.q || '').slice(0, 200), status: search.status || '', page: Math.max(1, Math.min(100000, Number.parseInt(search.page || '1', 10) || 1)) };
  const data = JSON.parse(JSON.stringify(await adminData(actor, filter))) as AdminData;
  return <Shell editor name={actor.name}><div className="page-heading"><span className="eyebrow">ADMINISTRAÇÃO MENTOR.iatron</span><h1>{{ '': 'Visão geral', conteudo: 'Gestão de conteúdo', alunos: 'Gestão de alunos', assinaturas: 'Assinaturas' }[section]}</h1><p>Organize a experiência de aprendizagem com segurança.</p></div><Admin data={data} section={section} admin={actor.admin}/></Shell>;
}
