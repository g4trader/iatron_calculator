"use client";
import Link from './NavigationLink';
import EditorDialog from './EditorDialog';
import PaymentProof from './PaymentProof';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen, Users, FileVideo, ArrowRight, Search, RotateCw, UserRound, ChevronLeft, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';
const ContentManager = dynamic(() => import('./ContentManager'), { loading: () => <p role="status">Carregando gestão de conteúdo…</p> });
import type { Module } from './editor-utils';
export type AdminData = { pendingRegistrations: { id: string; name: string | null; email: string | null; emailVerified: string | null; commercialStage?: string | null; commercialPaymentReference?: string | null }[]; filter: { query: string; status: string; page: number }; moduleCount: number; publishedLessonCount: number; studentCount: number; subscriptionCount: number; modules: Module[]; students: { user: { id: string; name: string | null; email: string | null; mentoryEnrollments: { status: string; subscription: { startedAt: string; expiresAt: string; status: string; renewalTermsVersion: string } }[] } }[]; subscriptions: { id: string; status: string; priceCents: number; renewalPriceCents: number; renewalTermsVersion: string; startedAt: string; expiresAt: string; user: { name: string | null; email: string | null } }[]; audit: { id: string; action: string; entityId: string; timestamp: string }[] };
const date = (s: string) => new Date(s).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const money = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n / 100);
const activityLabels: Record<string,string> = { 'module.save':'Módulo salvo', 'lesson.save':'Aula salva', 'material.save':'Material salvo', 'review':'Revisão registrada', 'publication':'Publicação atualizada', 'reorder':'Ordem de conteúdo atualizada', 'delete':'Conteúdo excluído', 'role':'Permissão atualizada', 'asset.upload':'Material enviado', 'media.upload.start':'Envio de vídeo iniciado', 'media.upload.verified':'Arquivo de mídia verificado', 'account.profile.updated':'Perfil atualizado', 'account.password.changed':'Senha atualizada' };
export default function Admin({ data, section, admin, canManageRoles = false }: { data: AdminData; section: string; admin: boolean; canManageRoles?: boolean }) {
  const router = useRouter(); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [query, setQuery] = useState(data.filter.query); const [status, setStatus] = useState(data.filter.status);
  const [modal,setModal]=useState(false);
  const [modalError,setModalError]=useState('');
  const [confirmed,setConfirmed]=useState(false);
  const lock=useRef(false);
  function openStudent(email='',renewal=false){
    setStudentUserId('');setPaymentReference('');
    setStudentEmail(email);setAccessType(renewal?'commercial':'trial');setAccessDays('30');setRenew(renewal);setConfirmed(false);setModalError('');setModal(true);
  }
  const [accessType,setAccessType]=useState('trial');
  const [studentEmail,setStudentEmail]=useState('');
  const [studentUserId,setStudentUserId]=useState('');
  const [accessDays,setAccessDays]=useState('30');
  const [renew,setRenew]=useState(false);
  const [paymentReference,setPaymentReference]=useState('');
  async function grantAccess(){
    if(lock.current)return;lock.current=true;
    setBusy(true);setMessage('');setModalError('');
    try{
      const r=await fetch('/api/mentory/admin/student-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:studentEmail,type:accessType,days:Number(accessDays),renew,paymentReference:paymentReference.trim()})});
      const d=await r.json();if(!r.ok)throw new Error(d.error);
      setMessage('Acesso liberado até '+date(d.expiresAt));setModal(false);router.refresh();
    }catch(e){setModalError(e instanceof Error?e.message:'Falha ao liberar acesso.');}finally{lock.current=false;setBusy(false);}
  }
  async function send(body: Record<string, unknown>) { setBusy(true); setMessage(''); try { const r = await fetch('/api/mentory/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await r.json(); if (!r.ok) throw new Error(result.error); setMessage('Alteração salva.'); router.refresh(); return true; } catch(e) { setMessage(e instanceof Error ? e.message : 'Falha ao salvar.'); return false; } finally { setBusy(false); } }
  function navigate(page: number) { router.push(`/mentory/admin/${section}?${new URLSearchParams({ q: query, status, page: String(page) })}`); }
  const count = section === 'alunos' ? data.studentCount : data.subscriptionCount;
  const pagination = <div className="row-actions"><button className="btn btn-outline" disabled={data.filter.page <= 1} onClick={() => navigate(data.filter.page - 1)}>Página anterior</button><span>Página {data.filter.page} · {count} resultados</span><button className="btn btn-outline" disabled={data.filter.page * 50 >= count} onClick={() => navigate(data.filter.page + 1)}>Próxima página</button></div>;
  const filter = <form className="form-grid" onSubmit={e => { e.preventDefault(); navigate(1); }}><label>Buscar por nome ou email<input value={query} onChange={e => setQuery(e.target.value)}/></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos</option>{['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELED'].map(s => <option key={s}>{s}</option>)}</select></label><button className="btn btn-outline">Aplicar filtros</button></form>;
  if (section === 'conteudo') return <ContentManager initial={data.modules} admin={admin}/>;
  return <><div role="status" aria-live="polite">{message && <p className="message">{message}</p>}</div>
  {!section && <><p className="data-period">Agora · situação atual dos registros</p><div className="operations-stats"><section className="stat"><BookOpen size={20}/><span>Módulos cadastrados</span><strong>{data.moduleCount}</strong></section><section className="stat"><FileVideo size={20}/><span>Aulas publicadas</span><strong>{data.publishedLessonCount}</strong></section><section className="stat"><Users size={20}/><span>Alunos cadastrados</span><strong>{admin ? data.studentCount : 'Restrito'}</strong></section></div>
  <section className="quick-actions"><h2>Ações rápidas</h2><div><Link href="/mentory/admin/conteudo?new=module"><Plus size={24}/><strong>Novo módulo</strong><span>Organize uma nova etapa</span></Link><Link href="/mentory/admin/conteudo?new=lesson"><FileVideo size={24}/><strong>Nova aula</strong><span>Conteúdo, vídeo e materiais</span></Link>{admin&&<Link href="/mentory/admin/alunos"><Users size={24}/><strong>Gerenciar alunos</strong><span>Consulte matrículas e acessos</span></Link>}<Link href="/mentory/admin/conteudo"><BookOpen size={24}/><strong>Gerenciar conteúdo</strong><span>Abrir biblioteca de módulos <ArrowRight size={14}/></span></Link></div></section>
  <div className="operations-grid"><section className="panel"><h2>Seu próximo passo</h2><p>{data.moduleCount?'Abra um módulo para preparar suas aulas, conferir os materiais e revisar a publicação.':'Crie o primeiro módulo para começar a organizar seu conteúdo.'}</p><Link className="btn btn-primary" href="/mentory/admin/conteudo">Abrir módulos</Link><p className="notice">As cobranças automáticas estão desativadas. Não há receita financeira a apresentar neste painel.</p></section>{admin&&<section className="panel"><h2>Atividade recente</h2><p className="notice">Últimos {Math.min(8,data.audit.length)} registros administrativos</p>{data.audit.length?<ol className="activity-list">{data.audit.slice(0,8).map(a=><li key={a.id}><span className="activity-dot"/><div><strong>{activityLabels[a.action]||'Ação administrativa registrada'}</strong><time dateTime={a.timestamp}>{date(a.timestamp)}</time></div></li>)}</ol>:<p>Nenhuma atividade registrada.</p>}{data.audit.length>8&&<details className="activity-more"><summary>Ver mais atividades</summary><ol className="activity-list">{data.audit.slice(8).map(a=><li key={a.id}><div><strong>{activityLabels[a.action]||'Ação administrativa registrada'}</strong><time dateTime={a.timestamp}>{date(a.timestamp)}</time></div></li>)}</ol></details>}</section>}</div></>}
    {section === 'alunos' && admin && <div className="students-workspace">
      <section className="panel students-awaiting">
        <header className="students-list-heading"><div><h2>Contas aguardando matrícula</h2><p>Contas verificadas, ainda sem matrícula. A existência de uma conta não confirma pagamento.</p></div></header>
        {data.pendingRegistrations.length ? <div className="students-table-scroll"><table className="students-table"><thead><tr><th>Conta</th><th>E-mail verificado</th><th>Status comercial</th><th>Ação</th></tr></thead><tbody>
          {data.pendingRegistrations.map(u=><tr key={u.id}><td><div className="student-identity"><span className="student-avatar"><UserRound size={20}/></span><div><strong>{u.name||'Aluno'}</strong><small>{u.email}</small></div></div></td><td>{u.emailVerified?date(u.emailVerified):'—'}</td><td>{u.commercialStage==='PAYMENT_CONFIRMED'?'Pagamento confirmado':'Aguardando negociação'}</td><td><button type="button" className="btn btn-primary" disabled={busy||!u.email} onClick={()=>{openStudent(u.email||'');setStudentUserId(u.id);setPaymentReference(u.commercialPaymentReference||'');setAccessType('commercial');}}>Aprovar pagamento e ativar</button></td></tr>)}
        </tbody></table></div> : <p className="notice">Nenhuma conta verificada sem matrícula encontrada nesta consulta.</p>}
      </section>
      <section className="panel students-list">
        <header className="students-list-heading"><div><h2>Alunos</h2><p>{count} {count===1?'resultado':'resultados'} · Gestão de matrículas e vigências</p></div></header>
        <form className="students-toolbar" onSubmit={e=>{e.preventDefault();navigate(1);}}>
          <label className="student-search"><Search size={19}/><input aria-label="Buscar aluno" placeholder="Buscar por nome ou e-mail" value={query} onChange={e=>setQuery(e.target.value)}/></label>
          <select aria-label="Filtrar situação" value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todas as situações</option><option value="ACTIVE">Ativos</option><option value="EXPIRED">Expirados</option><option value="PENDING">Pendentes</option><option value="CANCELED">Cancelados</option></select>
          <button className="btn btn-outline">Buscar</button>
          {(data.filter.query||data.filter.status)&&<button type="button" className="btn btn-outline" onClick={()=>{setQuery('');setStatus('');router.push('/mentory/admin/alunos');}}>Limpar</button>}
        </form>
        {data.students.length?<div className="students-table-scroll"><table className="students-table"><thead><tr><th>Aluno</th><th>Tipo de acesso</th><th>Situação</th><th>Vencimento</th><th>Ações</th></tr></thead><tbody>{data.students.map(({user:u})=>{
          const now=Date.now();
          const records=[...u.mentoryEnrollments].sort((a,b)=>Date.parse(b.subscription.expiresAt)-Date.parse(a.subscription.expiresAt));
          const item=records.find(e=>e.status==='ACTIVE'&&e.subscription.status==='ACTIVE'&&Date.parse(e.subscription.startedAt)<=now&&Date.parse(e.subscription.expiresAt)>now)||records[0];
          const sub=item?.subscription;
          const state=!item?'none':item.status==='ACTIVE'&&sub?.status==='ACTIVE'?(Date.parse(sub.expiresAt)<=now?'expired':Date.parse(sub.startedAt)>now?'pending':'active'):item.status==='CANCELED'||sub?.status==='CANCELED'?'canceled':item.status==='EXPIRED'||sub?.status==='EXPIRED'?'expired':'pending';
          const type=sub?.renewalTermsVersion?.startsWith('manual-trial')?'Experimental':sub?.renewalTermsVersion?.startsWith('manual-courtesy')?'Cortesia':sub?.renewalTermsVersion?.startsWith('manual-commercial')?'Comercial':sub?'Não classificado':'—';
          return <tr key={u.id}><td><div className="student-identity"><span className="student-avatar"><UserRound size={20}/></span><div><strong>{u.name||'Aluno'}</strong><small>{u.email||'Sem e-mail'}</small></div></div></td><td>{type}</td><td><span className={'student-status '+state}>{{active:'Ativo',expired:'Expirado',pending:'Pendente',canceled:'Cancelado',none:'Sem matrícula'}[state]}</span></td><td>{sub?new Date(sub.expiresAt).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):'—'}</td><td><button type="button" className="btn btn-outline" disabled={busy||!u.email} onClick={()=>openStudent(u.email||'',!!sub)}>{sub?<RotateCw size={16}/>:<Plus size={16}/>} {sub?'Renovar':'Liberar'}</button></td></tr>;
        })}</tbody></table></div>:<div className="students-empty"><Users size={36}/><h3>{data.filter.query||data.filter.status?'Nenhum resultado encontrado':'Nenhum aluno cadastrado'}</h3><p>{data.filter.query||data.filter.status?'Tente alterar os filtros.':'Use o botão + para liberar o primeiro acesso.'}</p></div>}
        {count>50&&<footer className="students-pagination"><span>Página {data.filter.page} de {Math.ceil(count/50)}</span><button aria-label="Página anterior" className="btn btn-outline" disabled={data.filter.page<=1} onClick={()=>navigate(data.filter.page-1)}><ChevronLeft size={18}/></button><button aria-label="Próxima página" className="btn btn-outline" disabled={data.filter.page*50>=count} onClick={()=>navigate(data.filter.page+1)}><ChevronRight size={18}/></button></footer>}
      </section>
      {canManageRoles&&<details className="panel students-advanced"><summary>Permissões avançadas</summary><form className="form-grid" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void send({action:'role',userId:f.get('userId'),role:f.get('role'),grant:f.get('grant')==='true'});}}><label>ID de usuário<input name="userId" required/></label><label>Permissão<select name="role"><option value="mentory_student">Aluno</option><option value="mentory_editor">Editor</option><option value="mentory_admin">Administrador</option><option value="mentory_enrollment_manager">Responsável por matrículas</option></select></label><label>Ação<select name="grant"><option value="true">Conceder</option><option value="false">Revogar</option></select></label><button className="btn btn-outline" disabled={busy}>Salvar permissão</button></form></details>}
      <button type="button" className="student-fab" aria-label="Cadastrar aluno" title="Cadastrar aluno" onClick={()=>openStudent()}><Plus size={32}/></button>
      {modal&&<EditorDialog title={renew?'Renovar acesso':'Cadastrar aluno'} close={()=>{if(!lock.current)setModal(false);}}><form className="student-modal-form" onSubmit={e=>{e.preventDefault();void grantAccess();}}>
        <p>Vincule uma conta Pediatron à mentoria e defina a vigência do acesso.</p>
        <fieldset disabled={busy}><label>E-mail da conta Pediatron<input autoFocus type="email" required value={studentEmail} readOnly={renew} onChange={e=>setStudentEmail(e.target.value)}/></label>
        <label>Tipo de acesso<select value={accessType} disabled={renew} onChange={e=>{setAccessType(e.target.value);setConfirmed(false);}}><option value="trial">Experimental</option><option value="courtesy">Cortesia</option><option value="commercial">Assinatura comercial</option></select></label>
        {accessType==='commercial'?<div className="student-access-summary"><strong>6 meses de acesso</strong><p>{renew?'A vigência será prorrogada a partir do vencimento atual ou de hoje, se expirada.':'A vigência começa na liberação.'}</p><label className="student-confirm"><input type="checkbox" required checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Confirmo a contratação ou renovação realizada externamente.</label><label>Referência do pagamento confirmado<input value={paymentReference} maxLength={200} onChange={e=>setPaymentReference(e.target.value)} placeholder="Identificador da transação ou referência interna"/><small>Informe a referência ou anexe o comprovante opcional.</small></label></div>:<label>Período de acesso (dias)<input type="number" min={1} max={730} required value={accessDays} onChange={e=>setAccessDays(e.target.value)}/><small>O acesso termina automaticamente após a vigência.</small></label>}
        </fieldset>
        {accessType==='commercial'&&studentUserId?<PaymentProof userId={studentUserId} manager/>:accessType==='commercial'?<p className="notice">Informe a referência do pagamento externo confirmado.</p>:null}
        {modalError&&<p role="alert" className="field-error">{modalError}</p>}
        <footer><button type="button" className="btn btn-outline" disabled={busy} onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" disabled={busy||(accessType==='commercial'&&!confirmed)}>{busy?'Salvando…':renew?'Confirmar renovação':'Liberar acesso'}</button></footer>
      </form></EditorDialog>}
    </div>}
    {section === 'assinaturas' && admin && <section className="panel">{filter}<p>Contratos registrados · horários de Brasília</p>{data.subscriptions.map(s => <article className="panel editor-card" key={s.id}><h2>{s.user.name || 'Assinante'}</h2><p>{s.user.email}</p><span className="status">{s.status === 'ACTIVE' && new Date(s.expiresAt).getTime() <= Date.now() ? 'EXPIRED' : s.status}</span><div className="subscription-grid"><div><span>Contratação</span><strong>{money(s.priceCents)}</strong></div><div><span>Renovação contratual</span><strong>{money(s.renewalPriceCents)}</strong></div><div><span>Início</span><strong>{date(s.startedAt)}</strong></div><div><span>Vencimento</span><strong>{date(s.expiresAt)}</strong></div></div><p>Termos: {s.renewalTermsVersion}</p></article>)}{pagination}{!data.subscriptions.length && <p>Nenhuma assinatura registrada.</p>}<div className="notice">Não há criação manual de pagamentos nem cobranças reais habilitadas.</div></section>}
  </>;
}
