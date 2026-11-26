import { NextRequest, NextResponse } from "next/server";
import { identity } from "@/lib/mentory/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const input = z.object({userId:z.string().min(1).max(128),stage:z.enum(["NEW","CONTACTED","NEGOTIATING","PAYMENT_CONFIRMED","LOST"]),paymentReference:z.string().trim().max(200).optional()});
export async function POST(req:NextRequest){
  const actor=await identity().catch(()=>null);
  if(!actor?.enrollmentManager)return NextResponse.json({error:"Acesso restrito."},{status:403});
  if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Origem inválida."},{status:403});
  const parsed=input.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Dados inválidos."},{status:400});
  const {userId,stage,paymentReference}=parsed.data;
  if(stage==="PAYMENT_CONFIRMED" && (!paymentReference || paymentReference.length<3))return NextResponse.json({error:"Informe a referência do pagamento."},{status:400});
  const target=await prisma.user.findFirst({where:{id:userId,funnelEvents:{some:{step:"account_created",source:"mentory_registration"}}},select:{id:true}});
  if(!target)return NextResponse.json({error:"Cadastro não localizado."},{status:404});
  await prisma.$transaction(async tx=>{
    await tx.user.update({where:{id:userId},data:{commercialStage:stage,commercialPaymentReference:stage==="PAYMENT_CONFIRMED"?paymentReference:null,commercialUpdatedAt:new Date()}});
    await tx.mentoryAuditLog.create({data:{actorId:actor.id,entityId:userId,action:"commercial.stage",metadata:{stage}}});
  });
  return NextResponse.json({ok:true});
}
