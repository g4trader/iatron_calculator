import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { identity } from '@/lib/mentory/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
const headers = {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const fail = (message:string,status:number)=>NextResponse.json({error:message},{status,headers});
const keyFor=(id:string)=>'mentory_payment_'+createHash('sha256').update(id).digest('hex');
async function resolveTarget(req:NextRequest){
 const actor=await identity();
 const requested=req.nextUrl.searchParams.get('userId');
 if(requested&&requested!==actor.id&&!actor.enrollmentManager) return null;
 return {actor,userId:requested||actor.id};
}
export async function POST(req:NextRequest){
 try{
  const host=req.headers.get('host'),origin=req.headers.get('origin');
  if(!host||origin!==`https://${host}`&&origin!==`http://${host}`&&!(host==='localhost:3000'&&origin==='http://localhost:3000'))return fail('Origem inválida.',403);
  const target=await resolveTarget(req);if(!target)return fail('Sem permissão.',403);
  const user=await prisma.user.findUnique({where:{id:target.userId},select:{id:true,emailVerified:true}});
  if(!user?.emailVerified)return fail('Confirme o e-mail antes de enviar o comprovante.',409);
  const active=await prisma.mentoryEnrollment.findFirst({where:{userId:target.userId,status:'ACTIVE',subscription:{status:'ACTIVE',expiresAt:{gt:new Date()}}},select:{id:true}});
  if(active&&!target.actor.enrollmentManager)return fail('Matrícula já ativa.',409);
  const data=await req.formData();const file=data.get('file');
  if(!(file instanceof File))return fail('Selecione um arquivo.',400);
  if(file.size<100||file.size>5*1024*1024)return fail('O comprovante deve ter até 5 MB.',400);
  const bytes=Buffer.from(await file.arrayBuffer());
  const pdf=bytes.subarray(0,5).toString()==='%PDF-';
  const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217;
  const contentType=pdf?'application/pdf':png?'image/png':jpeg?'image/jpeg':null;
  if(!contentType)return fail('Envie PDF, PNG ou JPEG válido.',400);
  const id=keyFor(target.userId),checksum=createHash('sha256').update(bytes).digest('hex');
  await prisma.$transaction(async tx=>{
   await tx.mentoryPrivateAsset.upsert({where:{id},create:{id,content:bytes,contentType,byteSize:bytes.length,checksum},update:{content:bytes,contentType,byteSize:bytes.length,checksum}});
   await tx.mentoryAuditLog.create({data:{actorId:target.actor.id,entityId:target.userId,action:'payment.proof.upload',metadata:{uploadedBy:target.actor.id,checksum,byteSize:bytes.length}}});
  });
  return NextResponse.json({ok:true},{headers});
 }catch{return fail('Não foi possível salvar o comprovante.',500)}
}
export async function GET(req:NextRequest){
 try{
  const target=await resolveTarget(req);if(!target)return fail('Sem permissão.',403);
  const asset=await prisma.mentoryPrivateAsset.findUnique({where:{id:keyFor(target.userId)}});
  if(!asset)return fail('Comprovante ainda não enviado.',404);
  return new NextResponse(new Uint8Array(asset.content),{headers:{...headers,'Content-Type':asset.contentType,'Content-Disposition':'attachment; filename="comprovante"','Content-Security-Policy':"sandbox; default-src 'none'",'Cross-Origin-Resource-Policy':'same-origin'}});
 }catch{return fail('Não foi possível abrir o comprovante.',500)}
}
