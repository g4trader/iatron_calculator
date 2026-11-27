import Link from 'next/link';
import {redirect} from 'next/navigation';
import Shell from '@/components/mentory/Shell';
import {pageIdentity} from '@/lib/mentory/server';
import {prisma} from '@/lib/prisma';
import type {Prisma} from '@prisma/client';
export const dynamic='force-dynamic';
export default async function Users({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}){
 const actor=await pageIdentity();if(!actor.admin)redirect('/mentory/admin/alunos');
 const params=await searchParams;const q=(params.q||'').trim().slice(0,200);const page=Math.max(1,Math.min(100000,parseInt(params.page||'1',10)||1));
 const where:Prisma.UserWhereInput=q?{OR:[{name:{contains:q,mode:'insensitive'}},{email:{contains:q,mode:'insensitive'}}]}:{};
 const [users,total]=await Promise.all([prisma.user.findMany({where,orderBy:[{createdAt:'desc'},{id:'asc'}],skip:(page-1)*25,take:25,select:{id:true,name:true,email:true,emailVerified:true,createdAt:true,mentoryRoles:{select:{role:true}},_count:{select:{licenses:true,mentoryEnrollments:true}}}}),prisma.user.count({where})]);
 return <Shell editor={actor.editor} admin={actor.admin} name={actor.name} email={actor.email}><div className="page-heading"><span className="eyebrow">ADMINISTRAÇÃO</span><h1>Gestão de usuários</h1><p>{total} contas Pediatron encontradas</p></div><form className="students-toolbar"><input name="q" defaultValue={q} placeholder="Buscar nome ou e-mail"/><button className="btn btn-outline">Buscar</button><Link className="btn btn-outline" href="/mentory/admin/alunos">Matrículas e permissões</Link></form><div className="access-user-list">{users.map(u=><section className="panel access-user" key={u.id}><div className="access-product"><div><strong>{u.name||'Usuário'}</strong><p>{u.email||'Sem e-mail'} · {u.emailVerified?'E-mail verificado':'E-mail não verificado'}</p><p>{u.mentoryRoles.map(r=>r.role).join(' · ')||'Conta Pediatron'} · {u._count.licenses+u._count.mentoryEnrollments} registros de acesso</p></div><Link className="btn btn-outline" href={'/mentory/admin/acessos?q='+encodeURIComponent(u.email||u.name||u.id)}>Gerenciar acessos</Link></div></section>)}</div><div className="row-actions">{page>1&&<Link href={'?'+new URLSearchParams({q,page:String(page-1)})}>Anterior</Link>}<span>Página {page}</span>{page*25<total&&<Link href={'?'+new URLSearchParams({q,page:String(page+1)})}>Próxima</Link>}</div></Shell>;
}
