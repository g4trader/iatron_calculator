import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/authz';
import { PasswordLoginForm } from '@/components/auth/PasswordLoginForm';
export default async function Login(){ if(await getCurrentUser()) redirect('/mentory/aprender'); return <main className="auth-bg"><div className="auth-card"><Link className="brand" href="/mentory">iatron.PED <small>Mentory</small></Link><h1>Bem-vindo à sua jornada.</h1><p>Entre com sua conta iatron.PED para continuar aprendendo.</p><PasswordLoginForm callbackUrl="/mentory/aprender"/><p className="login-note">O acesso à Mentory depende de uma matrícula própria. Sua conta clínica permanece a mesma.</p><Link className="text-link" href="/mentory">Voltar ao programa</Link></div></main>}
