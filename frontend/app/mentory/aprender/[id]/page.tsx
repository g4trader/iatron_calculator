import Link from 'next/link';
import LessonTabs from '@/components/mentory/LessonTabs';
import Shell from '@/components/mentory/Shell';
import { MaterialAccess, ProgressControl, VideoPlayer } from '@/components/mentory/Actions';
import { pageIdentity, lessonFor } from '@/lib/mentory/server';
import { MentoryError } from '@/lib/mentory/domain';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export default async function Lesson({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ preview?: string }> }) {
  const actor = await pageIdentity(); const { id } = await params; const preview = (await searchParams).preview === '1';
  let lesson; try { lesson = await lessonFor(actor, id, preview); } catch(e) { if (!(e instanceof MentoryError)) throw e; return <Shell editor={actor.editor} name={actor.name}><h1>Aula indisponível</h1><p>{e.message}</p><Link className="btn btn-primary" href="/mentory/assinatura">Consultar meu acesso</Link></Shell>; }
  const materialMetadata = await prisma.mentoryMaterial.findMany({ where: { id: { in: lesson.materials.map(m => m.id) } }, select: { id: true, asset: { select: { byteSize: true } } } });
  const progress = await prisma.mentoryLessonProgress.findUnique({ where: { userId_lessonId: { userId: actor.id, lessonId: id } } });
  const siblings = await prisma.mentoryLesson.findMany({ where: { moduleId: lesson.moduleId, ...(preview ? {} : { status: 'PUBLISHED' }) }, select: { id: true, title: true }, orderBy: [{ position: 'asc' }, { id: 'asc' }] });
  const next = siblings[siblings.findIndex(l => l.id === id) + 1];
  const previous = siblings[siblings.findIndex(l => l.id === id) - 1];
  const moduleProgress = await prisma.mentoryLessonProgress.findMany({ where: { userId: actor.id, lessonId: { in: siblings.map(l => l.id) } } });
  const href = (lessonId: string) => `/mentory/aprender/${lessonId}${preview ? '?preview=1' : ''}`;
  const trail = <><h2>Neste módulo</h2>{siblings.map((l, i) => { const state = moduleProgress.find(p => p.lessonId === l.id); return <Link className={'lesson-nav ' + (l.id === id ? 'selected' : '')} aria-current={l.id === id ? 'page' : undefined} href={href(l.id)} key={l.id}><span>{i + 1}</span><div><strong>{l.title}</strong><small>{state?.completedAt ? 'Concluída' : state?.lastPositionSeconds ? 'Em andamento' : 'A iniciar'}</small></div></Link>; })}</>;
  const adjacent = <div className="lesson-actions">{previous ? <Link className="btn btn-outline" href={href(previous.id)}>← Aula anterior</Link> : <Link className="btn btn-outline" href={preview ? '/mentory/admin/conteudo' : '/mentory/modulos'}>Lista de aulas</Link>}{next && <Link className="btn btn-primary" href={href(next.id)}>Próxima aula →</Link>}</div>;
  return <Shell editor={actor.editor} name={actor.name}>{preview && <p className="preview-label">Preview editorial · conteúdo não homologado para alunos</p>}<header className="page-heading classroom-heading"><Link className="back-link" href={preview ? '/mentory/admin/conteudo' : '/mentory/modulos'}>← Módulos</Link><span className="eyebrow">{lesson.module.title}</span><h1>{lesson.title}</h1></header><div className="learning-layout"><div><VideoPlayer id={id} preview={preview} position={progress?.lastPositionSeconds || 0}/><div className="lesson-status"><span>{progress?.completedAt ? 'Aula concluída' : 'Em estudo'} · {Math.ceil(lesson.duration / 60)} min</span></div>{adjacent}<LessonTabs key={id} tabs={[
    { id: 'about', label: 'Sobre a aula', content: <section className="panel"><h2>Sobre esta aula</h2><p className="text-body">{lesson.description}</p>{!preview && <ProgressControl id={id} duration={lesson.duration} completed={!!progress?.completedAt} position={progress?.lastPositionSeconds || 0}/>}</section> },
    { id: 'materials', label: 'Materiais', content: <section className="panel"><h2>Materiais da aula</h2>{lesson.materials.length ? lesson.materials.map(m => <div className="material-row" key={m.id}><div><strong>{m.title}</strong><span>{m.type}{materialMetadata.find(item => item.id === m.id)?.asset && ` · ${Math.ceil(materialMetadata.find(item => item.id === m.id)!.asset!.byteSize / 1024)} KB`}</span></div><MaterialAccess id={m.id} preview={preview}/></div>) : <p>Nenhum material disponível nesta aula.</p>}</section> },
    { id: 'lessons', label: 'Aulas', mobileOnly: true, content: <section className="panel">{trail}</section> }
  ]}/>{adjacent}</div><aside className="panel lesson-side">{trail}</aside></div></Shell>;
}
