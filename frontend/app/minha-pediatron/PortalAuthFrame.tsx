import Link from "next/link";
import type { ReactNode } from "react";
import "./portal.css";
export function PortalAuthFrame({children}:{children:ReactNode}){return <main className="portal-login portal-aux-auth"><section className="portal-intro"><Link href="/minha-pediatron"><img className="portal-logo" src="/mentory/brand/logo-principal.svg" alt="Ped Expert Mentory"/></Link><p className="portal-kicker">MINHA PEDIATRON</p><h1>Segurança da sua conta</h1></section><section className="portal-card portal-auth">{children}<Link className="portal-aux-back" href="/minha-pediatron">Voltar ao Minha Pediatron</Link></section></main>;}
