import { NextRequest, NextResponse } from "next/server";
import { identity } from "@/lib/mentory/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
const input = z.object({userId:z.string().min(1).max(128),stage:z.enum(["NEW","CONTACTED","NEGOTIATING","PAYMENT_CONFIRMED","LOST"]),paymentReference:z.string().trim().max(200).optional()});
export async function POST(req:NextRequest){
  const actor=await identity().catch(()=>null);
  if(!actor?.enrollmentManager)return NextResponse.json({error:"Acesso restrito."},{status:403});
  if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Origem inválida."},{status:403});
  const parsed=input.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Dados inválidos."},{status:400});
  const {userId,stage,paymentReference}=parsed.data;
  if(stage==="PAYMENT_CONFIRMED" && (!paymentReference || paymentReference.length<3))return NextResponse.json({error:"Informe a referência do pagamento."},{status:400});
  const target=await prisma.user.findFirst({where:{id:userId,funnelEvents:{some:{step:"account_created",source:"mentory_registration"}}},select:{id:true,name:true,email:true,commercialStage:true,commercialPaymentReference:true}});
  if(!target)return NextResponse.json({error:"Cadastro não localizado."},{status:404});
  await prisma.$transaction(async tx=>{
    await tx.user.update({where:{id:userId},data:{commercialStage:stage,commercialPaymentReference:stage==="PAYMENT_CONFIRMED"?paymentReference:null,commercialUpdatedAt:new Date()}});
    await tx.mentoryAuditLog.create({data:{actorId:actor.id,entityId:userId,action:"commercial.stage",metadata:{stage}}});
  });
  let notificationPending=false;
  if(stage==="PAYMENT_CONFIRMED" && (target.commercialStage!==stage || target.commercialPaymentReference!==paymentReference)){
    const admins=await prisma.mentoryRoleGrant.findMany({where:{role:"mentory_admin"},select:{user:{select:{email:true}}}});
    const recipients=[...new Set(admins.map(a=>a.user.email).filter((e):e is string=>Boolean(e)))];
    const results=await Promise.allSettled(recipients.map(to=>sendEmail({to,subject:"Pediatron — pagamento confirmado, ativação pendente",text:"A equipe comercial confirmou o pagamento de "+(target.name||target.email||target.id)+". Confira a matrícula em https://www.pediatron.com.br/mentory/admin/alunos."})));
    notificationPending=!recipients.length||results.some(r=>r.status==="rejected" || (r.status==="fulfilled"&&!r.value.delivered));
  }
  return NextResponse.json({ok:true,notificationPending});
}
