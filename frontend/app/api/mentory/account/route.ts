import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { identity } from '@/lib/mentory/server';
import { MentoryError } from '@/lib/mentory/domain';
import { profileInput, passwordInput } from '@/lib/mentory/account-validation';
import { hashPassword, verifyPassword } from '@/lib/password';
export const runtime='nodejs';
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(req:NextRequest){
 try{
  const actor=await identity();
  const origin=req.headers.get('origin');
  const host=req.headers.get('host');
  const local=host==='127.0.0.1:3000'||host==='localhost:3000';
  const expectedOrigin=`${local?'http':'https'}://${host}`;
  if(!origin||origin!==expectedOrigin||req.headers.get('sec-fetch-site')==='cross-site')throw new MentoryError(403,'Origem inválida. Atualize a página.');
  if(Number(req.headers.get('content-length')||0)>4096)throw new MentoryError(413,'Solicitação muito grande.');
  const raw=await req.text();if(raw.length>4096)throw new MentoryError(413,'Solicitação muito grande.');
  const body=JSON.parse(raw);const security=body?.action==='password';
  const parsed=(security?passwordInput:profileInput).safeParse(body);
  if(!parsed.success)return json({error:parsed.error.issues[0]?.message||'Dados inválidos.'},400);
  const window=Math.floor(Date.now()/900000);const key=`mentory:account:${actor.id}:${security?'password':'profile'}:${window}`;
  const limit=await prisma.mentoryRateBucket.upsert({where:{key},create:{key,count:1,resetAt:new Date((window+1)*900000)},update:{count:{increment:1}}});
  if(limit.count>(security?6:30))throw new MentoryError(429,'Limite de tentativas atingido. Tente novamente em 15 minutos.');
  const input=parsed.data;
  if(input.action==='profile'){
   const result=await prisma.$transaction(async tx=>{
    const changed=await tx.user.updateMany({where:{id:actor.id,updatedAt:new Date(input.version)},data:{name:input.name}});
    if(changed.count!==1)throw new MentoryError(409,'Seus dados foram alterados em outra sessão. Recarregue a página antes de salvar.');
    await tx.mentoryAuditLog.create({data:{actorId:actor.id,entityId:actor.id,action:'account.profile.updated'}});
    return tx.user.findUniqueOrThrow({where:{id:actor.id},select:{name:true,updatedAt:true}});
   });return json({name:result.name,version:result.updatedAt.toISOString()});
  }
  const credential=await prisma.passwordCredential.findUnique({where:{userId:actor.id}});
  if(!credential)throw new MentoryError(409,'Sua conta não utiliza senha local. Gerencie a senha no seu provedor de identidade.');
  if(!await verifyPassword(input.currentPassword,credential.passwordHash))throw new MentoryError(400,'Senha atual incorreta.');
  const passwordHash=await hashPassword(input.newPassword);
  await prisma.$transaction(async tx=>{
   const changed=await tx.passwordCredential.updateMany({where:{userId:actor.id,passwordHash:credential.passwordHash},data:{passwordHash}});
   if(changed.count!==1)throw new MentoryError(409,'A credencial foi alterada. Entre novamente.');
   await tx.passwordResetToken.updateMany({where:{userId:actor.id,usedAt:null},data:{usedAt:new Date()}});
   await tx.userSession.updateMany({where:{userId:actor.id,status:'ACTIVE'},data:{status:'REVOKED',revokedAt:new Date(),revokeReason:'password_changed'}});
   await tx.session.deleteMany({where:{userId:actor.id}});
   await tx.mentoryAuditLog.create({data:{actorId:actor.id,entityId:actor.id,action:'account.password.changed'}});
  });
  return json({ok:true,reauthenticate:true});
 }catch(e){if(e instanceof MentoryError)return json({error:e.message},e.status);if(e instanceof SyntaxError)return json({error:'Solicitação inválida.'},400);return json({error:'Não foi possível salvar. Tente novamente.'},500);}
}
