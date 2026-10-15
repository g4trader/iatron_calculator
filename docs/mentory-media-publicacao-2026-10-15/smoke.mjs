import { chromium } from '@playwright/test';
import { calculatePcrLocally } from '../lib/pcr-calculation-engine.ts';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.SMOKE_BASE || 'https://ped.iatron.com.br';
const out=process.env.SMOKE_OUTPUT;
if(!out)throw new Error('SMOKE_OUTPUT required');
await fs.mkdir(out+'/screenshots',{recursive:true});
const browser=await chromium.launch({channel:'chrome'});const context=await browser.newContext({baseURL:base,viewport:{width:1440,height:900},locale:'pt-BR'});const page=await context.newPage();
const report={base,started:new Date().toISOString(),checks:[],errors:[],authenticatedChecks:'User will perform; no test credentials supplied; no production test users created'};
page.on('pageerror',e=>report.errors.push(e.message));
const pass=name=>report.checks.push({name,status:'PASS'});
try{
 const r=await context.request.get('/api/health');assert.equal(r.status(),200);const h=await r.json();assert.equal(h.database,'connected');assert.equal(h.auth,'configured');pass('frontend/database/auth health');
 const br=await context.request.get('https://iatron-calculator-api-832112125521.us-central1.run.app/health');assert.equal(br.status(),200);pass('existing backend health');
 const input={pesoKg:15,idadeAnos:5,idadeMeses:2};const cr=await context.request.post('/api/calculate/pcr',{data:input});assert.equal(cr.status(),200);assert.equal(cr.headers()['x-pcr-calculation-source'],'backend');const result=await cr.json();
 const audited=JSON.parse(await fs.readFile('/Users/lucianoterres/Documents/GitHub 2/iatron_calculator/docs/redesign-v3/after/synthetic-result.json','utf8'));assert.deepEqual(result,audited);
 const norm=v=>Array.isArray(v)?v.map(norm):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([,x])=>x!==null&&x!==undefined).map(([k,x])=>[k,norm(x)])):v;assert.deepEqual(norm(result),norm(calculatePcrLocally(input)));pass('PCR synthetic response identical to audited V3 and clinical engine');
 assert.equal((await context.request.post('/api/calculate/pcr',{data:{...input,pesoKg:0}})).status(),400);pass('invalid PCR input rejected');
 for(const [route,name] of [['/','landing-v3'],['/mentory','landing-mentory'],['/login','login'],['/mentory/login','login-mentory']]){
  for(const width of [390,1440]){await page.setViewportSize({width,height:900});const response=await page.goto(route,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);await page.waitForFunction(()=>document.querySelectorAll('h1').length===1);await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`${out}/screenshots/${name}-${width}.png`,fullPage:true});pass(`${route} ${width}px no overflow`);}
 }
 for(const route of ['/dashboard/pcr','/dashboard/biblioteca-medicamentos','/dashboard/infusao-continua','/admin']){await page.goto(route);await page.waitForURL(url => url.pathname === '/login');assert.equal(new URL(page.url()).pathname,'/login');pass(`${route} authentication required`);}
 for(const route of ['/mentory/admin','/mentory/admin/conteudo','/mentory/aprender','/mentory/assinatura']){await page.goto(route);await page.waitForURL(url => url.pathname === '/mentory/login');assert.equal(new URL(page.url()).pathname,'/mentory/login');pass(`${route} authentication required`);}
 for(const route of ['/api/mentory/subscription','/api/mentory/progress','/api/mentory/materials/unknown','/api/mentory/lessons/unknown/video','/api/mentory/lessons/unknown/captions']){assert.equal((await context.request.get(route)).status(),401);pass(`${route} unauthorized denied`);}
 for(const route of ['/api/mentory/admin','/api/mentory/upload','/api/mentory/checkout','/api/mentory/media/start','/api/mentory/media/finish']){assert.equal((await context.request.post(route,{data:{}})).status(),401);pass(`${route} anonymous mutation denied`);}
 assert.equal(report.errors.length,0);report.status='PASS';
}catch(e){report.status='FAIL';report.failure=e.message;process.exitCode=1;}finally{report.finished=new Date().toISOString();await fs.writeFile(out+'/smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();}
