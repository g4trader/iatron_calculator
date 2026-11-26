import { PedBrand } from "@/components/mentory/PedBrand";
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/authz';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { GraduationCap, CheckCircle2, ShieldCheck } from 'lucide-react';

export default async function MentoryRegister(){
  if(await getCurrentUser())redirect('/minha-pediatron');
  return <main className="mentory-auth-page">
    <section className="mentory-auth-intro">
      <Link href="/mentory" className="mentory-auth-brand"><PedBrand variant="signature"/></Link>
      <span className="mentory-auth-eyebrow">SUA JORNADA COMEÇA AQUI</span>
      <h1>Aprenda com segurança. Evolua na prática.</h1>
      <p>Uma única conta para acompanhar sua formação e acessar os recursos incluídos na sua mentoria.</p>
      <ul><li><CheckCircle2/> Trilha de conhecimento organizada</li><li><CheckCircle2/> Comunidade e conteúdos bônus</li><li><ShieldCheck/> Acesso protegido e individual</li></ul>
    </section>
    <section className="mentory-auth-form-panel">
      <div className="mentory-auth-card"><span className="mentory-auth-eyebrow">CADASTRO</span><h2>Crie sua conta</h2><p>Crie sua conta gratuita e entre na comunidade aberta. Confirme seu e-mail para acessar a plataforma. As aulas da mentoria são exclusivas para assinantes.</p><RegisterForm mentory/><p className="mentory-auth-back"><Link href="/mentory/login">Já possui conta? Entrar</Link></p></div>
    </section>
  </main>;
}
