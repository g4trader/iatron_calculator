import Link from '@/components/mentory/NavigationLink';
import { notFound } from 'next/navigation';
import Shell from '@/components/mentory/Shell';
import { ProfileForm, PasswordForm, PreferencesForm } from '@/components/mentory/AccountForms';
import { pageIdentity, subscriptionFor } from '@/lib/mentory/server';
import { prisma } from '@/lib/prisma';
import { activeAccess, money, renewalQuote } from '@/lib/mentory/domain';
export const dynamic='force-dynamic';
const sections=[['perfil','Dados pessoais'],['seguranca','Segurança'],['preferencias','Preferências'],['assinatura','Assinatura']];
const date=(d:Date)=>new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(d);
export default async function Account({params}:{params:Promise<{section?:string[]}>}){
 const actor=await pageIdentity();const section=(await params).section?.join('/')||'';
 if(section&&!['perfil','seguranca','preferencias','assinatura','pagamentos'].includes(section))notFound();
 const user=await prisma.user.findUniqueOrThrow({where:{id:actor.id},select:{name:true,email:true,updatedAt:true,passwordCredential:{select:{id:true}},accounts:{select:{provider:true}}}});
 const subscription=section==='assinatura'?await subscriptionFor(actor.id):null;
 const status=subscription?(activeAccess(subscription)?'Ativa':subscription.status==='ACTIVE'?(subscription.expiresAt<=new Date()?'Expirada':'Aguardando início'):({PENDING:'Pendente',EXPIRED:'Expirada',CANCELED:'Cancelada'} as Record<string,string>)[subscription.status]||subscription.status):'Nenhuma assinatura cadastrada';
 const titles:Record<string,string>={perfil:'Dados pessoais',seguranca:'Segurança e senha',preferencias:'Preferências',assinatura:'Minha assinatura',pagamentos:'Pagamentos'};
 return <Shell editor={actor.editor} name={user.name}><Link className="account-back" href={section?'/mentory/conta':'/mentory/aprender'}>← {section?'Minha conta':'Voltar aos estudos'}</Link><header className="page-heading"><span className="eyebrow">MINHA CONTA</span><h1>{titles[section]||'Minha conta'}</h1><p>Seus dados e seu acesso à MENTOR.iatron.</p></header><div className={`account-layout ${section?'account-child':''}`}><nav className="account-nav" aria-label="Configurações da conta">{sections.map(([path,label])=><Link href={`/mentory/conta/${path}`} key={path} aria-current={section===path?'page':undefined}>{label}</Link>)}</nav><section className="panel account-content">
 {!section&&<><h2>{user.name||'Sua conta'}</h2><dl className="account-summary"><dt>Email</dt><dd>{user.email||'Não informado'}</dd></dl><p>Gerencie seus dados, sua segurança e as condições do seu acesso.</p></>}
 {section==='perfil'&&<ProfileForm name={user.name} email={user.email} version={user.updatedAt.toISOString()}/>}
 {section==='seguranca'&&(user.passwordCredential?<PasswordForm/>:<><h2>Acesso por provedor externo</h2><p>Sua conta não possui senha local. Gerencie sua credencial com o provedor utilizado no login.</p>{user.accounts.some(a=>a.provider==='google')&&<a className="btn btn-outline" href="https://myaccount.google.com/security" rel="noreferrer">Segurança da conta Google</a>}{user.accounts.some(a=>a.provider==='facebook')&&<a className="btn btn-outline" href="https://accountscenter.facebook.com/password_and_security" rel="noreferrer">Segurança da conta Facebook</a>}</>)}
 {section==='preferencias'&&<PreferencesForm/>}
 {section==='assinatura'&&<><h2>Seu contrato</h2><span className="status">{status}</span>{subscription?<><div className="subscription-grid"><div><span>Valor contratado</span><strong>{money(subscription.priceCents)}</strong></div><div><span>Vigência contratual</span><strong>6 meses</strong></div><div><span>Início · horário de Brasília</span><strong>{date(subscription.startedAt)}</strong></div><div><span>Acesso até · horário de Brasília</span><strong>{date(subscription.expiresAt)}</strong></div><div><span>Preço individual de renovação</span><strong>{money(renewalQuote(subscription).priceCents)}</strong></div><div><span>Versão dos termos</span><strong>{subscription.renewalTermsVersion}</strong></div></div><p>O preço de renovação acima é o valor individual registrado no seu contrato. A garantia de preço segue os termos dessa contratação; não significa cobrança automática.</p>{subscription.priceCents===0&&<p>Contrato sem valor de cobrança registrado. Consulte as condições concedidas à sua conta.</p>}</>:<p>Não há contrato registrado para esta conta. Nenhuma compra ou pagamento é presumido.</p>}<div className="notice">Contratação online, cobrança e renovação automática estão desativadas. Consulte acima o status real do seu acesso.</div><p><Link href="/mentory/termos">Termos da plataforma</Link> · <Link href="/mentory/privacidade">Privacidade</Link></p></>}
 {section==='pagamentos'&&<><h2>Histórico indisponível</h2><p>O provedor de pagamentos da MENTOR.iatron ainda não foi integrado. Não há histórico ou comprovantes disponíveis nesta área.</p></>}
 </section></div></Shell>;
}
