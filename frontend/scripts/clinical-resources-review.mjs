// Local-only evidence: disposable E2E account, no production browsing or patient data.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const baseURL=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3000';
if(!['localhost','127.0.0.1'].includes(new URL(baseURL).hostname))throw Error('Local evidence only');
const out=path.resolve(process.env.CLINICAL_EVIDENCE_DIR||'../docs/clinical-resources/screenshots');await fs.mkdir(out,{recursive:true});
const {default:AxeBuilder}=await import(process.env.AXE_PLAYWRIGHT_MODULE||'/tmp/iatron-a11y/node_modules/@axe-core/playwright/dist/index.mjs');
const browser=await chromium.launch({channel:'chrome',headless:true});const ctx=await browser.newContext({baseURL,viewport:{width:1440,height:900},locale:'pt-BR',timezoneId:'America/Sao_Paulo'});const page=await ctx.newPage();page.setDefaultTimeout(30000);
const report={widths:[],accessibility:[],touchTargets:[],checks:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
const csrf=await (await ctx.request.get('/api/auth/csrf')).json();await ctx.request.post('/api/auth/callback/credentials',{form:{csrfToken:csrf.csrfToken,email:'e2e+active@iatron.test',password:process.env.E2E_PASSWORD||'IatronE2E#2026',callbackUrl:'/dashboard/pcr',redirect:'false'},maxRedirects:0});
async function capture(name,fullPage=true){await page.screenshot({path:path.join(out,name+'.png'),fullPage});}
async function verify(name,width){
 const targets=await page.locator('.clinical-resources a, .clinical-resources button, .clinical-resources input, .clinical-resources select, .clinical-resources summary').evaluateAll(nodes=>nodes.map(el=>({tag:el.tagName,height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width})).filter(r=>r.height>0&&r.width>0&&(r.height<44||r.width<44)));report.touchTargets.push({name,width,undersized:targets});assert.equal(targets.length,0,JSON.stringify({name,width,targets}));
 const overflow=await page.evaluate(()=>({viewport:innerWidth,body:document.documentElement.scrollWidth,offenders:Array.from(document.querySelectorAll('.clinical-resources *')).filter(el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&s.visibility!=='hidden'&&(r.right>innerWidth+1||r.left< -1);}).map(el=>({tag:el.tagName,class:el.className})).slice(0,5)}));report.widths.push({name,width,...overflow});assert.ok(overflow.body<=width && overflow.offenders.length===0,JSON.stringify({name,width,overflow}));
 if([1440,390].includes(width)){const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();report.accessibility.push({name,width,violations:axe.violations});assert.equal(axe.violations.length,0,JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));}
}
if(process.argv.includes('--drawer-only')){await page.setViewportSize({width:390,height:844});await page.goto('/dashboard/biblioteca-medicamentos',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Filtros',exact:true}).click();await page.locator('dialog[open]').waitFor();await capture('filters-mobile',false);await browser.close();console.log('Drawer viewport captured');process.exit(0);}
try{
 for(const width of [1440,390,320,375,768]){
  await page.setViewportSize({width,height:width===1440?900:844});
  await page.goto('/dashboard/biblioteca-medicamentos',{waitUntil:'networkidle'});await page.getByRole('heading',{name:'Biblioteca de medicamentos',exact:true}).waitFor();await verify('catalog',width);await capture('catalog-'+width,false);
  await page.getByRole('searchbox').fill('dipirona');await capture('catalog-filtered-'+width);
  await page.goto('/dashboard/biblioteca-medicamentos/medications-002',{waitUntil:'networkidle'});await verify('detail',width);await capture('detail-'+width);
  await page.getByText('Fonte e rastreabilidade · linha 2',{exact:true}).click();await verify('provenance',width);if(width===390)await capture('provenance-mobile');
  await page.goto('/dashboard/infusao-continua',{waitUntil:'networkidle'});await verify('infusion',width);await capture('infusion-blocked-'+width);
  await page.getByLabel('Selecionar droga').selectOption('infusions-009');await verify('vasopressin',width);if([1440,390].includes(width))await capture('vasopressin-'+width);
  for(const input of await page.locator('.cr-locked input').all()){assert.equal(await input.inputValue(),'');assert.equal(await input.isDisabled(),true);}
 }
 for(const width of [1440,390]){await page.setViewportSize({width,height:900});await page.goto('/dashboard/biblioteca-medicamentos/medications-047',{waitUntil:'networkidle'});const peers=page.getByRole('navigation',{name:'Apresentações deste medicamento'});assert.ok((await peers.getByRole('link',{name:'1g/pó · EV/IM · ANTIBIÓTICOS EV',exact:true}).count())===1);assert.ok((await peers.getByRole('link',{name:'1g/pó · IM · CEFTRIAXONA IM',exact:true}).count())===1);await verify('ceftriaxone-contexts',width);await capture('ceftriaxone-contexts-'+width);}
 await page.setViewportSize({width:390,height:844});await page.goto('/dashboard/biblioteca-medicamentos',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Filtros',exact:true}).click();await verify('filter-drawer',390);await capture('filters-mobile',false);
 for(let i=0;i<15;i++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.querySelector('dialog[open]')?.contains(document.activeElement)));}
 await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);await page.waitForFunction(()=>document.body.style.overflow==='');assert.equal(await page.evaluate(()=>document.body.style.overflow),'');assert.ok(await page.getByRole('button',{name:'Filtros',exact:true}).evaluate(el=>el===document.activeElement));report.checks.push('Filter drawer keyboard trap/Escape/focus return/scroll restoration');
 await page.getByRole('searchbox').fill('zz-nonexistent');await page.getByRole('heading',{name:'Nenhuma apresentação encontrada'}).waitFor();await capture('empty-mobile');
 await page.setViewportSize({width:1440,height:900});await page.route('**/dashboard/infusao-continua?*',async route=>{await new Promise(r=>setTimeout(r,1500));await route.continue();});
 await page.goto('/dashboard/biblioteca-medicamentos',{waitUntil:'domcontentloaded'});await page.getByRole('searchbox').waitFor();
 await page.locator('.ped-sidebar').getByRole('link',{name:'Infusão contínua',exact:true}).click();await page.getByRole('status').filter({hasText:'Carregando'}).first().waitFor();await capture('navigation-loading',false);await page.waitForURL('**/infusao-continua');await page.unrouteAll({behavior:'wait'});
 assert.equal(report.errors.length,0);report.status='PASS';
}catch(e){report.status='FAIL';report.failure=e.stack;process.exitCode=1;}finally{await fs.writeFile(path.join(out,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,failure:report.failure,widthChecks:report.widths.length,axeChecks:report.accessibility.length,errors:report.errors},null,2));await browser.close();}
