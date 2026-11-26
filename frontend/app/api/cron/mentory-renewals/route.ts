import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { runMentoryReminders } from '@/lib/mentory/reminders';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  const secret=process.env.CRON_SECRET;
  const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||'';
  if(!secret||!token||Buffer.byteLength(token)!==Buffer.byteLength(secret)||!timingSafeEqual(Buffer.from(token),Buffer.from(secret))){
    return NextResponse.json({error:'Unauthorized'},{status:401,headers:{'Cache-Control':'no-store'}});
  }
  try{return NextResponse.json({ok:true,...await runMentoryReminders()},{headers:{'Cache-Control':'no-store'}});}
  catch{return NextResponse.json({error:'Reminder job failed'},{status:500,headers:{'Cache-Control':'no-store'}});}
}
