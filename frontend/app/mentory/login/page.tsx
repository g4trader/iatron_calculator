import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/authz';
import { PasswordLoginForm } from '@/components/auth/PasswordLoginForm';
export default async function Login(){ if(await getCurrentUser()) redirect('/mentory/aprender'); return <main className="auth-bg mentory-login"><div className="auth-card"><Link className="brand" href="/mentory"><img src="/mentory/brand/logo-principal.svg" alt="Ped Expert Mentory" /></Link><h1>Entre na sua conta</h1><p>Continue sua jornada de aprendizado.</p><PasswordLoginForm callbackUrl="/mentory/aprender"/><p className="login-note">Use sua conta Pediatron. O acesso às aulas depende de matrícula ativa.</p><Link className="text-link" href="/mentory">Voltar ao programa</Link></div></main>}
