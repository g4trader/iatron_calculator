import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
const demo = '/mentory/admin/demonstracao';
test('UX V2: primeira dobra, abas por teclado, contexto, responsividade e texto 200%', async ({ page }, info) => {
 test.setTimeout(90000);
 const errors: string[] = [];
 page.on('pageerror', e => errors.push(e.message));
 await login(page, 'mentory-test-admin@iatron.test', demo);
 for (const width of [390, 768, 1280, 1440]) {
  await page.setViewportSize({width,height:width===390?844:900});
  const cta=page.getByRole('button',{name:'Continuar aula',exact:true});
  const rect=await cta.boundingBox(); expect(rect!.y+rect!.height).toBeLessThan(760);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Continuar aula',exact:true}).click();
 const video=page.locator('video');
 const rect=await video.boundingBox();expect(rect!.y+rect!.height).toBeLessThan(650);
 expect(rect!.width/rect!.height).toBeCloseTo(16/9,1);
 await page.getByRole('tab',{name:'Sobre a aula',exact:true}).focus();
 await page.keyboard.press('ArrowRight');
 await expect(page.getByRole('tab',{name:'Materiais',exact:true})).toBeFocused();
 await page.getByRole('button',{name:/^Abrir Roteiro/}).click();
 await expect(page.getByRole('region',{name:'Leitor de material'})).toBeFocused();
 await page.getByRole('tab',{name:'Anotações',exact:true}).click();
 await page.getByLabel('Minha anotação de exemplo').fill('Estado temporário de teste.');
 await page.getByRole('tab',{name:'Roteiro',exact:true}).click();
 await page.getByRole('tab',{name:'Anotações',exact:true}).click();
 await expect(page.getByLabel('Minha anotação de exemplo')).toHaveValue('Estado temporário de teste.');
 await page.getByRole('tab',{name:'Materiais',exact:true}).click();
 await expect(page.getByRole('region',{name:'Leitor de material'})).toBeVisible();
 await page.getByRole('tab',{name:'Aulas',exact:true}).click();
 await expect(page.getByRole('tabpanel').getByRole('button')).toHaveCount(4);
 await page.getByRole('button',{name:'Próxima aula →',exact:true}).first().click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('Equipamentos: organização do estudo');
 for(const width of [390,768,1280,1440]) {
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});
 await page.addStyleTag({content: 'html {font-size:200% !important;}'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('text-200-percent.png'),fullPage:true});
 await page.reload(); await page.getByRole('button',{name:'Continuar aula',exact:true}).click();
 await page.getByRole('tab',{name:'Anotações',exact:true}).click();
 await expect(page.getByLabel('Minha anotação de exemplo')).toHaveValue('');
 expect(errors).toEqual([]);
});
test('UX V2: aluno real mantém progresso, materiais e isolamento após sair', async ({page})=>{
 await login(page,'mentory-test-student-a@iatron.test','/mentory/aprender');
 await page.getByRole('link',{name:'Continuar aula',exact:false}).click();
 const lessonUrl=page.url();
 await page.getByRole('spinbutton', { name: 'Retomar no segundo' }).fill('42');
 await page.getByRole('button',{name:'Salvar posição',exact:true}).click();
 await expect(page.getByText('Progresso salvo.',{exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'Materiais',exact:true}).click();
 await page.getByRole('button',{name:'Abrir material',exact:true}).first().click();
 await expect(page.getByRole('tabpanel')).toContainText('Material sintético de teste.');
 await page.reload();await expect(page.getByRole('spinbutton', { name: 'Retomar no segundo' })).toHaveValue('42');
 await expect(page.getByRole('tab',{name:'Anotações',exact:true})).toHaveCount(0);
 const {csrfToken}=await (await page.request.get('/api/auth/csrf')).json();
 await page.request.post('/api/auth/signout',{form:{csrfToken,callbackUrl:'/mentory/login'}});
 await page.goto(lessonUrl);await expect(page).toHaveURL(/\/mentory\/login/);
 expect((await page.request.get('/api/mentory/admin/overview')).status()).not.toBe(200);
});
