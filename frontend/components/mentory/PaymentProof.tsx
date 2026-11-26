'use client';
import { useState } from 'react';
import { LockKeyhole, UploadCloud, FileCheck2 } from 'lucide-react';

export default function PaymentProof({userId,manager=false}:{userId?:string;manager?:boolean}){
 const [file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const endpoint='/api/mentory/payment-proof'+(userId?'?userId='+encodeURIComponent(userId):'');
 async function submit(){
  if(!file)return;
  setBusy(true);setMessage('');
  try{
   const form=new FormData();form.set('file',file);
   const r=await fetch(endpoint,{method:'POST',body:form});
   const data=await r.json();if(!r.ok)throw new Error(data.error||'Falha no envio.');
   setMessage('Comprovante recebido com segurança. A aprovação depende da conferência administrativa.');
   setFile(null);
  }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível enviar.');}
  finally{setBusy(false)}
 }
 return <section className="panel" style={{padding:24,marginBottom:24}}>
  <span className="eyebrow"><LockKeyhole size={16}/> MATRÍCULA PENDENTE</span>
  <h2>{manager?'Comprovante de pagamento do aluno':'Envie seu comprovante de pagamento'}</h2>
  <p>{manager?'Anexe o documento recebido e confira os dados antes de ativar a matrícula.':'Sua conta está criada, mas os conteúdos permanecem bloqueados até a aprovação do pagamento pela equipe responsável.'}</p>
  <label style={{display:'grid',gap:8,margin:'16px 0',fontWeight:600}}>Comprovante (PDF, JPG ou PNG, até 4 MB)
   <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e=>setFile(e.target.files?.[0]||null)} disabled={busy}/>
  </label>
  <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
   <button type="button" className="btn btn-primary" onClick={()=>void submit()} disabled={!file||busy}><UploadCloud size={17}/>{busy?'Enviando…':'Enviar comprovante'}</button>
   {manager&&userId?<a className="btn btn-outline" href={endpoint} target="_blank" rel="noopener noreferrer"><FileCheck2 size={17}/>Consultar comprovante</a>:null}
  </div>
  {message&&<p role="status" style={{marginTop:12}}>{message}</p>}
 </section>;
}
