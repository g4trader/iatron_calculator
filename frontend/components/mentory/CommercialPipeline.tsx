"use client";
import { useState } from "react";
import PaymentProof from "./PaymentProof";
type Lead={id:string;name:string|null;email:string|null;whatsapp:string|null;emailVerified:boolean;commercialStage:string|null;commercialPaymentReference:string|null};
const stages=[["NEW","Novo"],["CONTACTED","Contatado"],["NEGOTIATING","Em negociação"],["PAYMENT_CONFIRMED","Pagamento confirmado"],["ACTIVATED","Mentoria ativada"],["LOST","Encerrado"]];
function LeadRow({lead}:{lead:Lead}){
 const [stage,setStage]=useState(lead.commercialStage||"NEW"),[reference,setReference]=useState(lead.commercialPaymentReference||""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 async function save(){setBusy(true);setMessage("");try{const r=await fetch("/api/mentory/commercial",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:lead.id,stage,paymentReference:reference})});const data=await r.json();setMessage(r.ok?"Registro salvo.":data.error||"Falha ao salvar.");}catch{setMessage("Falha de conexão.");}finally{setBusy(false);}}
 return <article className="mb-3 rounded-lg border p-4"><strong>{lead.name||lead.email}</strong><p>{lead.email} · {lead.emailVerified?"Verificado":"Não verificado"}</p>{lead.whatsapp&&<a href={"https://wa.me/"+lead.whatsapp.replace(/\D/g,"")} target="_blank" rel="noopener noreferrer">{lead.whatsapp}</a>}<div className="mt-3 flex flex-wrap gap-2"><select aria-label="Status comercial" value={stage} onChange={e=>setStage(e.target.value)}>{stages.map(([v,l])=><option key={v} value={v} disabled={v==="ACTIVATED"}>{l}</option>)}</select>{stage==="PAYMENT_CONFIRMED"&&<input aria-label="Referência do pagamento" value={reference} onChange={e=>setReference(e.target.value)} maxLength={200}/>}<button disabled={busy||stage==="ACTIVATED"} onClick={save}>Salvar</button></div>{stage==="PAYMENT_CONFIRMED" && <PaymentProof userId={lead.id} manager/>}<p role="status">{message}</p></article>;
}
export default function CommercialPipeline({users}:{users:Lead[]}){return <>{users.map(lead=><LeadRow key={lead.id} lead={lead}/>)}</>;}
