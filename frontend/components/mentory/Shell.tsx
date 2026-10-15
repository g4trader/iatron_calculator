'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, Library, ShieldCheck, UserRound, GraduationCap, ArrowLeft } from 'lucide-react';
const items = [{ href: '/mentory/aprender', label: 'Visão geral', icon: LayoutDashboard }, { href: '/mentory/modulos', label: 'Meus módulos', icon: BookOpen }, { href: '/mentory/materiais', label: 'Materiais', icon: Library }, { href: '/mentory/assinatura', label: 'Assinatura', icon: UserRound }];
export default function Shell({ children, editor, name, demo }: { children: React.ReactNode; editor: boolean; name: string | null; demo?: { active: number; navigate: (index: number) => void } }) {
  const pathname = usePathname();
  const navigation = (mobile = false) => items.map(({ href, label, icon: Icon }, index) => {
    const active = demo ? demo.active === index : pathname === href || (index === 1 && pathname.startsWith('/mentory/aprender/'));
    const content = <><Icon size={mobile ? 20 : 18} aria-hidden="true"/><span>{mobile && index === 1 ? 'Módulos' : label}</span></>;
    return demo ? <button key={href} type="button" aria-current={active ? 'page' : undefined} className={`nav-item ${active ? 'active' : ''}`} onClick={() => demo.navigate(index)}>{content}</button> : <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`nav-item ${active ? 'active' : ''}`}>{content}</Link>;
  });
  return <div className={`app-shell ${demo || !pathname.includes('/admin') ? 'student-workspace' : ''}`}><a className="skip" href="#mentory-main">Pular para o conteúdo</a><aside className="sidebar"><Link href="/mentory" className="brand inverse"><GraduationCap size={23} aria-hidden="true"/> MENTOR.iatron</Link><div className="nav-label">SUA JORNADA</div><nav aria-label="MENTOR.iatron">{navigation()}{editor && <Link className="nav-item" href="/mentory/admin"><ShieldCheck size={18} aria-hidden="true"/>Administração</Link>}</nav><div className="sidebar-bottom"><Link className="nav-item" href="/dashboard/pcr"><ArrowLeft size={18} aria-hidden="true"/>Plataforma clínica</Link><Link className="nav-item" href="/mentory">Sobre a MENTOR.iatron</Link></div></aside><div className="workspace"><header className="topbar"><span className="eyebrow">{!demo && pathname.includes('/admin') ? 'GESTÃO DA MENTORIA' : 'MENTOR.iatron'}</span><span>{name || 'Minha conta'} {editor && <Link href="/mentory/admin"> · Gestão</Link>}</span></header><main id="mentory-main" className="workspace-main">{children}</main></div><nav className="bottom-nav" aria-label="Navegação mobile">{navigation(true)}</nav></div>;
}
