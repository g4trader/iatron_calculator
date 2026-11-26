import { redirect } from "next/navigation";
import Link from "next/link";
import { identity } from "@/lib/mentory/server";
import { prisma } from "@/lib/prisma";
import CommercialPipeline from "@/components/mentory/CommercialPipeline";
export default async function CommercialPage({searchParams}:{searchParams:Promise<{q?:string}>}){
 const actor=await identity().catch(()=>null);
 if(!actor)redirect("/mentory/login");
 if(!actor.enrollmentManager)redirect("/minha-pediatron");
 const q=(await searchParams).q?.trim().slice(0,120)||"";
 const users=await prisma.user.findMany({where:{funnelEvents:{some:{step:"account_created",source:"mentory_registration"}},...(q?{OR:[{name:{contains:q,mode:"insensitive"}},{email:{contains:q,mode:"insensitive"}},{whatsapp:{contains:q}}]}:{})},select:{id:true,name:true,email:true,whatsapp:true,emailVerified:true,commercialStage:true,commercialPaymentReference:true},orderBy:{createdAt:"desc"},take:100});
 return <main className="mx-auto max-w-5xl p-6"><Link href="/minha-pediatron">Minha Pediatron</Link><h1 className="my-4 text-2xl font-bold">Central comercial</h1><form className="mb-4"><input name="q" defaultValue={q} placeholder="Nome, e-mail ou WhatsApp"/><button>Pesquisar</button></form><CommercialPipeline users={users.map(u=>({...u,emailVerified:Boolean(u.emailVerified)}))}/></main>;
}
