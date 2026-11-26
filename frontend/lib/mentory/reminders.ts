import 'server-only';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const reminderDays = [30, 15, 7, 1, 0] as const;
const MS_DAY = 86400000;
type ReminderDay = typeof reminderDays[number];
function dayRange(now:Date, days:number){
  const start = new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())+days*MS_DAY);
  return { gte:start, lt:new Date(start.getTime()+MS_DAY) };
}
function title(day:ReminderDay){
  return day===0?'Pediatron — assinatura expirada':day===1?'Pediatron — sua mentoria vence amanhã':`Pediatron — mentoria vence em ${day} dias`;
}
export async function runMentoryReminders(now=new Date()){
  const staff=await prisma.mentoryRoleGrant.findMany({where:{role:{in:['mentory_enrollment_manager','mentory_admin']}},select:{role:true,user:{select:{email:true}}}});
  const admins=Array.from(new Set(staff.filter(s=>s.role==='mentory_admin').map(s=>s.user.email).filter((v):v is string=>Boolean(v))));
  const commercial=Array.from(new Set(staff.filter(s=>s.role==='mentory_enrollment_manager').map(s=>s.user.email).filter((v):v is string=>Boolean(v))));
  const summary={evaluated:0,sent:0,pending:0,skipped:0};
  for(const day of reminderDays){
    const subs=await prisma.mentorySubscription.findMany({
      where:{status:'ACTIVE',renewalTermsVersion:{startsWith:'manual-commercial-'},expiresAt:dayRange(now,day),enrollment:{status:'ACTIVE'}},
      select:{id:true,userId:true,expiresAt:true,user:{select:{email:true,name:true}}},
      take:300
    });
    for(const sub of subs){
      summary.evaluated++;
      const recipients=day===0?admins:day===15?commercial:day===30?Array.from(new Set([sub.user.email,...commercial].filter((v):v is string=>Boolean(v)))):sub.user.email?[sub.user.email]:[];
      if(!recipients.length){summary.skipped++;continue;}
      const eventType=`D${day}`;
      const text=day===0?
        `A mentoria de ${sub.user.name||sub.user.email||sub.userId} venceu em ${date}. Revise a matrícula e providencie a remoção manual do grupo fechado do WhatsApp, preservando a comunidade aberta e a Folha PCR conforme suas vigências.`:
        day===15?
        `Entre em contato pelo fluxo consultivo com ${sub.user.name||sub.user.email||sub.userId}. A mentoria vence em ${date}. Consulte a central comercial da Pediatron.`:
        `Olá, ${sub.user.name||'assinante'}! Sua Ped Expert Mentory vence em ${date}. Para renovar, converse com nossa equipe na comunidade aberta. Acesse https://www.pediatron.com.br/minha-pediatron. Não há cobrança automática.`;

      for(const to of recipients){
        const record=await prisma.mentoryReminderDelivery.upsert({
          where:{subscriptionId_eventType_recipientEmail:{subscriptionId:sub.id,eventType,recipientEmail:to}},
          create:{subscriptionId:sub.id,userId:sub.userId,eventType,recipientEmail:to,nextAttemptAt:now},
          update:{}
        });
        if(record.status==='SENT'||record.attempts>=6||record.nextAttemptAt>now){summary.skipped++;continue;}
        const claim=await prisma.mentoryReminderDelivery.updateMany({
          where:{id:record.id,status:{in:['PENDING','FAILED','SENDING']},attempts:{lt:6},nextAttemptAt:{lte:now}},
          data:{status:'SENDING',attempts:{increment:1},nextAttemptAt:new Date(now.getTime()+30*60000)}
        });
        if(!claim.count){summary.skipped++;continue;}
        try{
          const result=await sendEmail({to,subject:title(day),text});
          if(!result.delivered)throw new Error('Email not delivered');
          await prisma.mentoryReminderDelivery.update({where:{id:record.id},data:{status:'SENT',sentAt:new Date(),nextAttemptAt:new Date()}});
          summary.sent++;
        }catch{
          await prisma.mentoryReminderDelivery.update({where:{id:record.id},data:{status:'FAILED',nextAttemptAt:new Date(now.getTime()+Math.min(24,2**record.attempts)*3600000)}});
          summary.pending++;
        }
      }
    }
  }
  return summary;
}
