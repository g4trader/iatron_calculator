import Link from 'next/link';
import { redirect } from 'next/navigation';
import Shell from '@/components/mentory/Shell';
import Admin, { type AdminData } from '@/components/mentory/Admin';
import { pageIdentity, adminData } from '@/lib/mentory/server';
import { getAdminCurrentUser } from '@/lib/admin-permissions';
import ClinicalLicenses from './ClinicalLicenses';
export const dynamic='force-dynamic';
type Search={q?:string;status?:string;page?:string;view?:string;clinicalProduct?:string;origin?:string;organizationId?:string;message?:string;error?:string};
export default async function AccessPage({searchParams}:{searchParams:Promise<Search>}){
 const actor=await pageIdentity();if(!actor.admin)redirect('/mentory/admin');
 const params=await searchParams;const clinical=params.view==='clinicos';
 const operator=await getAdminCurrentUser();const canClinical=operator?.adminPermissions.includes('admin.licenses.manage')??false;
 const filter={query:(params.q||'').slice(0,200),status:params.status||'',page:Math.max(1,Math.min(100000,Number.parseInt(params.page||'1',10)||1))};
 const data=clinical?null:JSON.parse(JSON.stringify(await adminData(actor,filter,'assinaturas'))) as AdminData;
 return <Shell editor={actor.editor} admin={actor.admin} name={actor.name} email={actor.email}><div className="page-heading"><span className="eyebrow">ADMINISTRAÇÃO</span><h1>Gestão de acessos</h1><p>Gerencie as vigências e os direitos de acesso aos produtos.</p></div><nav className="tabs access-tabs" aria-label="Produtos"><Link className={'btn '+(!clinical?'btn-primary':'btn-outline')} href="/mentory/admin/acessos">Ped Expert Mentory</Link><Link className={'btn '+(clinical?'btn-primary':'btn-outline')} href="/mentory/admin/acessos?view=clinicos">Ferramentas clínicas</Link><Link className="btn btn-outline" href="/mentory/admin/alunos">Gerenciar matrículas</Link></nav>{clinical?(canClinical?<ClinicalLicenses searchParams={Promise.resolve(params)}/>:<section className="panel"><h2>Permissão comercial necessária</h2><p>Seu perfil não possui autorização para administrar licenças clínicas.</p></section>):data&&<Admin data={data} section="assinaturas" admin={actor.enrollmentManager} canManageRoles={actor.admin}/>}</Shell>;
}
