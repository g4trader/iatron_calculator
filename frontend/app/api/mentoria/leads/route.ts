import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
const CRM_URL = 'https://connect.fromcore.com.br/webhook/mentory-ped';
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().min(10).max(25),
  email: z.email().max(254),
  consent: z.literal(true),
  website: z.string().max(200).optional().default(''),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
});
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({error:'Origem não permitida.'},{status:403});
  const secret = process.env.MENTORY_PED_CRM_SECRET;
  if (!secret) return NextResponse.json({error:'Inscrições temporariamente indisponíveis.'},{status:503});
  let raw: unknown;
  try {
    if (Number(request.headers.get('content-length') || 0) > 4096) throw new Error('Payload grande');
    raw = await request.json();
  } catch { return NextResponse.json({error:'Dados inválidos.'},{status:400}); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({error:'Revise os dados informados e o consentimento.'},{status:400});
  const data = parsed.data;
  if (data.website) return NextResponse.json({error:'Não foi possível confirmar o cadastro.'},{status:400});
  const digits = data.phone.replace(/\D/g,'');
  if (!/^[1-9][0-9]9[0-9]{8}$/.test(digits)) return NextResponse.json({error:'Informe um celular brasileiro com DDD válido.'},{status:400});
  const payload = {
    name:data.name, phone:`+55${digits}`, email:data.email.trim().toLowerCase(),
    source:'iatron-mentoria-lancamento', consent:true, consent_timestamp:new Date().toISOString(),
    utm_source:data.utm_source,utm_medium:data.utm_medium,utm_campaign:data.utm_campaign,
    utm_content:data.utm_content,utm_term:data.utm_term,
  };
  try {
    const response=await fetch(CRM_URL,{
      method:'POST',headers:{'Content-Type':'application/json','mentory-ped-lp':secret},
      body:JSON.stringify(payload),signal:AbortSignal.timeout(8000),cache:'no-store',
    });
    if (!response.ok) return NextResponse.json({error:'Não foi possível confirmar sua inscrição. Tente novamente.'},{status:502});
    // A resposta 2xx confirma transporte; persistência precisa de verificação no CRM.
    return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  } catch {return NextResponse.json({error:'Serviço temporariamente indisponível. Tente novamente.'},{status:502});}
}
