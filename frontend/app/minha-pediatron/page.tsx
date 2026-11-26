import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { SaaSPage, NeuralCard } from "@/components/saas/SaaSChrome";
import { PasswordLoginForm } from "@/components/auth/PasswordLoginForm";

export default async function MinhaPediatron() {
  const user = await getCurrentUser();
  if (!user) return <SaaSPage><main className="mx-auto max-w-md px-4 py-12"><NeuralCard className="p-6"><h1 className="text-2xl font-bold text-white">Minha Pediatron</h1><PasswordLoginForm callbackUrl="/minha-pediatron"/><Link href="/cadastro" className="mt-4 block text-cyan-200">Criar conta gratuita</Link></NeuralCard></main></SaaSPage>;
  const now = new Date();
  const [grant, enrollment, previous] = await Promise.all([
    prisma.mentoryRoleGrant.findFirst({where:{userId:user.id,role:"mentory_student"}}),
    prisma.mentoryEnrollment.findFirst({where:{userId:user.id,status:"ACTIVE",subscription:{status:"ACTIVE",startedAt:{lte:now},expiresAt:{gt:now}}},include:{subscription:true}}),
    prisma.mentorySubscription.findFirst({where:{userId:user.id},orderBy:{expiresAt:"desc"}})
  ]);
  const active = Boolean(grant && enrollment);
  const openUrl = process.env.PEDIATRON_OPEN_COMMUNITY_URL || "https://chat.whatsapp.com/IZfXGWubm5gKO9baqP2lWa";
  const closedUrl = active ? process.env.PEDIATRON_CLOSED_COMMUNITY_URL : undefined;
  return <SaaSPage><main className="mx-auto max-w-5xl px-4 py-10">
    <Link href="/" className="text-cyan-200">PEDIATRON.</Link>
    <h1 className="mt-6 text-3xl font-bold text-white">Minha Pediatron</h1>
    <p className="mt-2 text-slate-300">Olá, {user.name || "bem-vindo"}! Seus recursos em um só lugar.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <NeuralCard className="p-6"><h2 className="text-xl font-bold text-white">Comunidade aberta</h2><p className="my-3 text-slate-300">Networking e informações sobre a mentoria.</p><a className="text-cyan-200" href={openUrl} target="_blank" rel="noopener noreferrer">Entrar no WhatsApp</a></NeuralCard>
      <NeuralCard className="p-6"><h2 className="text-xl font-bold text-white"><img src="/mentory/brand/logo-curta.svg" alt="Ped Expert Mentory" className="h-auto w-48 max-w-full"/></h2><p className="my-3 text-slate-300">{active ? "Assinatura ativa até " + enrollment!.subscription.expiresAt.toLocaleDateString("pt-BR",{timeZone:"UTC"}) : previous ? "Acesso não ativo. Consulte a equipe para renovar." : "Conheça o programa e converse com nossa equipe na comunidade."}</p><Link className="text-cyan-200" href={active ? "/mentory/aprender" : "/ped-expert-mentory"}>{active ? "Acessar aulas" : "Conhecer a mentoria"}</Link>{closedUrl && <a className="mt-3 block text-cyan-200" href={closedUrl} target="_blank" rel="noopener noreferrer">Solicitar entrada no grupo fechado</a>}</NeuralCard>
      <NeuralCard className="p-6"><h2 className="text-xl font-bold text-white">Folha PCR</h2><p className="my-3 text-slate-300">{user.folhaPcrBenefitUntil && user.folhaPcrBenefitUntil > now ? "Benefício ativo até " + user.folhaPcrBenefitUntil.toLocaleDateString("pt-BR",{timeZone:"UTC"}) : "Ferramenta digital de apoio à prática clínica."}</p><Link className="text-cyan-200" href="/folha-pcr">Acessar Folha PCR</Link></NeuralCard>
      <NeuralCard className="p-6"><h2 className="text-xl font-bold text-white">Minha conta</h2><p className="my-3 text-slate-300">{user.email}</p><Link className="text-cyan-200" href="/profile">Gerenciar conta</Link></NeuralCard>
    </div>
  </main></SaaSPage>;
}
