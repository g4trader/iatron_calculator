import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/authz';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { GraduationCap, CheckCircle2, ShieldCheck } from 'lucide-react';

export default async function MentoryRegister(){
  if(await getCurrentUser())redirect('/mentory/aprender');
  return <main className="mentory-auth-page">
    <section className="mentory-auth-intro">
      <Link href="/mentory" className="mentory-auth-brand"><img src="/mentory/brand/logo-principal.svg" alt="Ped Expert Mentory" style={{width:270,maxWidth:"100%",height:"auto"}}/></Link>
      <span className="mentory-auth-eyebrow">SUA JORNADA COMEÇA AQUI</span>
      <h1>Aprenda com segurança. Evolua na prática.</h1>
      <p>Uma única conta para acompanhar sua formação e acessar os recursos incluídos na sua mentoria.</p>
      <ul><li><CheckCircle2/> Trilha de conhecimento organizada</li><li><CheckCircle2/> Comunidade e conteúdos bônus</li><li><ShieldCheck/> Acesso protegido e individual</li></ul>
    </section>
    <section className="mentory-auth-form-panel">
      <div className="mentory-auth-card"><span className="mentory-auth-eyebrow">CADASTRO</span><h2>Crie sua conta</h2><p>Informe seus dados e confirme seu e-mail para continuar. O acesso às aulas depende da ativação da matrícula.</p><RegisterForm mentory/><p className="mentory-auth-back"><Link href="/mentory/login">Já possui conta? Entrar</Link></p></div>
    </section>
  </main>;
}
