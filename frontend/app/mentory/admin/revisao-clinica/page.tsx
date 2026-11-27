import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {redirect} from "next/navigation";
import Shell from "@/components/mentory/Shell";
import {pageIdentity} from "@/lib/mentory/server";
import {clinicalCatalog} from "@/lib/clinical-catalog";
import {getClinicalReviewHistory,recordClinicalIndexReview} from "@/lib/clinical-review-server";
import {revalidatePath} from "next/cache";
export const dynamic="force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<{record?:string;q?:string;version?:string}>}){
 const actor=await pageIdentity();
 if(!actor.admin)redirect("/mentory");
 const allowed=(process.env.CLINICAL_REVIEWER_IDS??"").split(",").map(x=>x.trim()).includes(actor.id);
 const {record,q="",version}=await searchParams;
 const selected=clinicalCatalog.find(x=>String(x.row)===record);
 const versions=selected?await prisma.clinicalSourceVersion.findMany({where:{recordId:String(selected.row)},select:{version:true,sourceSha256:true,importedAt:true},orderBy:{importedAt:"desc"}}):[];
 const activeVersion=versions.find(v=>v.version===version)?.version??"index-v1";
 const history=selected?await getClinicalReviewHistory(String(selected.row),activeVersion):[];
 async function save(form:FormData){"use server";await recordClinicalIndexReview({recordId:String(form.get("recordId")??""),version:String(form.get("version")??""),state:String(form.get("state")??""),reference:String(form.get("reference")??""),reason:String(form.get("reason")??"")});revalidatePath("/mentory/admin/revisao-clinica");}
 return <Shell editor={actor.editor} admin={actor.admin} name={actor.name} email={actor.email}><div className="page-heading"><h1>Revisão clínica documental</h1><p>Índice de medicamentos. Nenhuma posologia está homologada por este painel.</p></div><section className="panel"><form><label>Buscar<input name="q" defaultValue={q}/></label><button className="btn btn-outline">Buscar</button></form><div className="grid gap-2">{clinicalCatalog.filter(x=>(x.name+" "+x.category).toLowerCase().includes(q.toLowerCase())).map(x=><Link key={x.row} href={"?"+new URLSearchParams({record:String(x.row),q})}>{x.name} · {x.category} · linha {x.row}</Link>)}</div></section>{selected&&<section className="panel"><h2>{selected.name} · linha {selected.row}</h2><p>Versão selecionada: {activeVersion} · revisão exclusivamente documental</p><Link href={"?"+new URLSearchParams({record:String(selected.row),q})}>Revisar índice</Link><h3>Versões de origem importadas</h3>{versions.length===0?<p>Nenhuma versão importada.</p>:versions.map(v=><article key={v.version}><Link href={"?"+new URLSearchParams({record:String(selected.row),q,version:v.version})}>{v.version}</Link><p>Importada em {v.importedAt.toISOString()}</p><p>SHA-256 da fonte: {v.sourceSha256}</p><p>Conteúdo não homologado para uso terapêutico.</p></article>)}{allowed?<form action={save} className="form-grid"><input type="hidden" name="recordId" value={selected.row}/><input type="hidden" name="version" value={activeVersion}/><label>Decisão<select name="state"><option value="in_review">Em revisão</option><option value="correction_required">Correção necessária</option><option value="revoked">Revogado</option></select></label><label>Referência<input name="reference" required minLength={3} maxLength={1000}/></label><label>Justificativa<textarea name="reason" required minLength={8} maxLength={2000}/></label><button className="btn btn-primary">Registrar decisão</button></form>:<p>Consulta somente. Revisor não autorizado.</p>}<h3>Histórico</h3>{history.length===0?<p>Nenhum evento.</p>:history.map(e=><article key={e.id}><strong>{e.state}</strong><p>{e.reviewedAt.toISOString()} · {e.reviewerId}</p><p>{e.reference} · {e.reason}</p></article>)}</section>}</Shell>;
}
