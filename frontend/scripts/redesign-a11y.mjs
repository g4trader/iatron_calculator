import {chromium} from '@playwright/test';
const { default: AxeBuilder } = await import(process.env.AXE_PLAYWRIGHT_MODULE || '@axe-core/playwright');
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});
const context=await browser.newContext({baseURL:'http://127.0.0.1:3000',viewport:{width:1440,height:1000}});
const page=await context.newPage();
const results=[];
async function audit(label){const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();results.push({label,violations:r.violations,incomplete:r.incomplete.map(x=>({id:x.id,impact:x.impact,nodes:x.nodes.length}))});console.log(label,r.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})));}
await page.goto('/');await audit('landing-desktop');await page.setViewportSize({width:390,height:844});await audit('landing-mobile');
const {csrfToken}=await(await context.request.get('/api/auth/csrf')).json();await context.request.post('/api/auth/callback/credentials',{form:{csrfToken,email:'e2e+active@iatron.test',password:'IatronE2E#2026',callbackUrl:'/dashboard/pcr'},maxRedirects:0});
await page.goto('/dashboard/pcr');await page.waitForFunction(()=>document.querySelector('input[type=date]')?.value);await audit('pcr-mobile-empty');await page.setViewportSize({width:1440,height:1000});await audit('pcr-desktop-empty');
const n=page.locator('input[type=number]');await n.nth(0).fill('5');await n.nth(1).fill('2');await n.nth(2).fill('15');await page.locator('.pcr-calculator-surface').getByText('Epinefrina',{exact:true}).waitFor();await audit('pcr-result-desktop');await page.setViewportSize({width:390,height:844});await audit('pcr-result-mobile');
await writeFile((process.env.REDESIGN_EVIDENCE_DIR || '../docs/redesign-evidence') + '/accessibility.json',JSON.stringify(results,null,2));await browser.close();
