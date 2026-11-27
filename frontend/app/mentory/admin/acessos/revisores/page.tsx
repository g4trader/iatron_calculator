import Link from "next/link";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import Shell from "@/components/mentory/Shell";
import {pageIdentity} from "@/lib/mentory/server";
import {prisma} from "@/lib/prisma";
import {requireAdminPermission} from "@/lib/admin-permissions";
import {validateAdminStepUp,stepUpPasswordFromForm,CRITICAL_ADMIN_ACTIONS} from "@/lib/admin-step-up";
export const dynamic="force-dynamic";
const permissions=[{key:"clinical.document.review",label:"Revisão documental"},{key:"clinical.document.homologate",label:"Homologação clínica"}] as const;
const route="/mentory/admin/acessos/revisores";
async function save(form:FormData){"use server";
 const actor=await pageIdentity();if(!actor.admin)redirect("/mentory");
 const manager=await requireAdminPermission("admin.users.manage");if(manager.id!==actor.id)redirect("/mentory");
 const id=String(form.get("userId")??""),operation=String(form.get("operation")??""),reason=String(form.get("reason")??"").trim();
 if(!["grant","revoke"].includes(operation)||reason.length<8||reason.length>1000)throw new Error("Operação ou justificativa inválida.");
 const permission=String(form.get("permission")??"");if(!permissions.some(p=>p.key===permission))throw new Error("Permissão inválida");
 const grant=operation==="grant";
 await validateAdminStepUp({admin:actor,action:grant?CRITICAL_ADMIN_ACTIONS.accessGrantPermission:CRITICAL_ADMIN_ACTIONS.accessRevokePermission,password:stepUpPasswordFromForm(form),resourceType:"clinical_review",resourceId:id});
 await prisma.$transaction(async tx=>{
 const target=await tx.mentoryRoleGrant.findFirst({where:{userId:id,role:"mentory_admin"}});
 if(!target)throw new Error("Usuário não possui acesso administrativo Mentory.");
 if(grant)await tx.adminPermissionGrant.upsert({where:{userId_permission:{userId:id,permission}},create:{userId:id,permission,reason,grantedByUserId:actor.id},update:{status:"ACTIVE",reason,grantedByUserId:actor.id,revokedByUserId:null,revokedAt:null}});
 else await tx.adminPermissionGrant.updateMany({where:{userId:id,permission,status:"ACTIVE"},data:{status:"REVOKED",reason,revokedByUserId:actor.id,revokedAt:new Date()}});
 await tx.adminAuditEvent.create({data:{actorUserId:actor.id,targetUserId:id,action:grant?"clinical.review.granted":"clinical.review.revoked",resourceType:"clinical_review",resourceId:id,metadata:{reason,permission}}});
 });
 revalidatePath(route);revalidatePath("/mentory/admin/revisao-clinica");redirect(route+"?saved=1");
}
export default async function Page({searchParams}:{searchParams:Promise<{q?:string;saved?:string}>}){
 const actor=await pageIdentity();if(!actor.admin)redirect("/mentory");
 const manager=await requireAdminPermission("admin.users.manage");if(manager.id!==actor.id)redirect("/mentory");
 const params=await searchParams,q=(params.q??"").trim().slice(0,200);
 const users=await prisma.user.findMany({where:{mentoryRoles:{some:{role:"mentory_admin"}},...(q?{OR:[{name:{contains:q,mode:"insensitive" as const}},{email:{contains:q,mode:"insensitive" as const}}]}:{})},select:{id:true,name:true,email:true,adminPermissionGrants:{where:{permission:{in:permissions.map(p=>p.key)}},select:{permission:true,status:true,revokedAt:true}}},orderBy:{name:"asc"},take:100});
 return <Shell admin={actor.admin} editor={actor.editor} name={actor.name} email={actor.email}><div className="page-heading"><Link href="/mentory/admin/acessos">← Acessos</Link><h1>Revisores clínicos</h1><p>Autorizações individuais de revisão e homologação. Conceda homologação somente a profissional com habilitação verificada. Não habilitam prescrição ou calculadora.</p></div>{params.saved&&<p role="status">Permissão atualizada com auditoria.</p>}<form className="panel form-grid"><label>Buscar administrador<input name="q" defaultValue={q}/></label><button className="btn btn-outline">Buscar</button></form>{users.flatMap(u=>permissions.map(p=>{const active=u.adminPermissionGrants.some(g=>g.permission===p.key&&g.status==="ACTIVE"&&!g.revokedAt);return <section className="panel" key={u.id+p.key}><h2>{u.name||"Usuário"}</h2><p>{u.email} · {p.label} · {active?"Autorizado":"Sem autorização"}</p><form action={save} className="form-grid"><input type="hidden" name="permission" value={p.key}/><input type="hidden" name="userId" value={u.id}/><input type="hidden" name="operation" value={active?"revoke":"grant"}/><label>Justificativa<input name="reason" required minLength={8} maxLength={1000}/></label><label>Senha atual<input name="stepUpPassword" type="password" required autoComplete="current-password"/></label><button className="btn btn-outline">{active?"Revogar autorização":"Conceder autorização"}</button></form></section>}))}{!users.length&&<p>Nenhum administrador encontrado.</p>}</Shell>;
}