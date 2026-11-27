"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
export function PortalLogout(){const [pending,setPending]=useState(false);const [error,setError]=useState("");async function logout(){setPending(true);setError("");try{await signOut({redirect:false,callbackUrl:"/minha-pediatron"});window.location.assign("/minha-pediatron");}catch{setError("Não foi possível sair. Tente novamente.");setPending(false);}}return <div><button type="button" className="portal-logout" disabled={pending} onClick={()=>void logout()}><LogOut aria-hidden="true"/>{pending?"Saindo…":"Sair"}</button>{error&&<p className="portal-logout-error" role="alert">{error}</p>}</div>;}
