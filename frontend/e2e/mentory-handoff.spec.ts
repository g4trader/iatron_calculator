import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { login } from './helpers/auth';
import { mediaRange } from '../lib/mentory/media-range';
const db = new PrismaClient();
const base = 'http://127.0.0.1:3000';
test.afterAll(() => db.$disconnect());
test('Handoff: editor completo persiste conteúdo, upload, materiais, revisão e acesso do aluno', async ({ page, browser }, info) => {
  test.setTimeout(120000);
  const title = `Handoff sintético ${info.project.name}`;
  const clip = await readFile('assets/mentory-demo/lesson.mp4');
  let moduleId = ''; let lessonId = ''; let starts = 0;
  await login(page,'mentory-test-admin@iatron.test','/mentory/admin/conteudo');
  try {
    await page.getByRole('button',{name:'Novo módulo',exact:true}).click();
    await page.getByRole('dialog').getByLabel('Título do módulo').fill(title);
    await page.getByRole('dialog').getByLabel('Descrição').fill('Conteúdo sintético de teste. Sem uso clínico.');
    await page.getByRole('button',{name:'Salvar módulo em rascunho'}).click();
    await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
    moduleId=(await db.mentoryModule.findFirstOrThrow({where:{title}})).id;
    await page.getByRole('button',{name:'Editar módulo',exact:true}).click();
    await page.getByRole('dialog').getByLabel('Descrição').fill('Descrição editada e persistida.');
    await page.getByRole('button',{name:'Salvar módulo em rascunho'}).click();
    await expect(page.getByText('Descrição editada e persistida.',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Nova aula',exact:true}).click();
    await page.getByLabel('Título da aula').fill('Aula sintética do handoff');
    await page.getByLabel('Descrição',{exact:true}).fill('Aula não clínica para validar a experiência.');
    await page.getByLabel('Duração estimada (minutos)').fill('2');
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath('editor-conteudo.png'),fullPage:true});
    let releaseSave!:()=>void;const saveGate=new Promise<void>(resolve=>{releaseSave=resolve;});
    await page.route('**/api/mentory/admin',async route=>{await saveGate;await route.continue();},{times:1});
    try {await page.getByRole('button',{name:'Salvar e continuar',exact:true}).click();await expect(page.getByLabel('Título da aula')).toBeDisabled();await expect(page.locator('#lesson-content-form textarea')).toBeDisabled();}finally{releaseSave();}

    await expect(page.getByRole('heading',{name:'Vídeo e legendas',exact:true})).toBeVisible();
    lessonId=(await db.mentoryLesson.findFirstOrThrow({where:{moduleId}})).id;
    await page.getByLabel('Selecionar vídeo MP4',{exact:true}).setInputFiles({name:'invalid.mp4',mimeType:'video/mp4',buffer:Buffer.from('invalid content')});
    await expect(page.locator('.field-error[role=alert], .editor-error[role=alert]')).toContainText('não corresponde');
    // Only external media transport is mocked: editor persistence/RBAC/review/material storage use the real local APIs.
    await page.route('**/api/mentory/media/start',async r=>{starts++;if(starts===1)return r.fulfill({status:503,json:{error:'Falha de conexão de teste'}});const kind=r.request().postDataJSON().kind;return r.fulfill({json:{id:`handoff-${kind}`,uploadUrl:base+'/handoff-upload',contentType:kind==='video'?'video/mp4':'text/vtt'}});});
    await page.route('**/handoff-upload',r=>r.fulfill({status:200,body:''}));
    await page.route('**/api/mentory/media/finish',r=>r.fulfill({json:{id:r.request().postDataJSON().id}}));
    await page.getByLabel('Selecionar vídeo MP4',{exact:true}).setInputFiles({name:'aula-sintetica.mp4',mimeType:'video/mp4',buffer:clip});
    await expect(page.locator('.field-error[role=alert], .editor-error[role=alert]')).toContainText('Falha de conexão');
    await page.getByRole('button',{name:'Tentar envio novamente',exact:true}).click();
    await expect(page.getByText('Arquivo verificado.',{exact:false})).toBeVisible();
    await page.getByLabel('Selecionar legendas VTT',{exact:true}).setInputFiles({name:'legendas.vtt',mimeType:'text/vtt',buffer:Buffer.from('WEBVTT\n\n00:00.000 --> 00:01.000\nDemonstração\n')});
    await expect(page.getByText('Arquivo privado disponível',{exact:true})).toHaveCount(2);
    await expect(page.getByLabel('ID do vídeo')).toHaveCount(0);await expect(page.getByLabel('ID das legendas')).toHaveCount(0);
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath('editor-upload.png'),fullPage:true});
    await page.getByRole('button',{name:'Salvar e continuar',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Materiais da aula',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Adicionar material',exact:true}).click();
    await page.getByRole('dialog').getByLabel('Nome do material').fill('Guia sintético em PDF');
    await page.getByRole('dialog').getByLabel('Tipo de material').selectOption('PDF');
    await page.getByRole('dialog').getByLabel('Arquivo PDF · até 3 MB').setInputFiles({name:'guia.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n% Synthetic handoff only\n%%EOF')});
    await page.getByRole('button',{name:'Salvar material',exact:true}).click();
    await expect(page.getByText('Guia sintético em PDF',{exact:true})).toBeVisible();
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath('editor-materiais.png'),fullPage:true});
    await page.getByRole('button',{name:'Continuar',exact:true}).click();
    await page.getByLabel('Referência da revisão médica').fill('FIXTURE-LOCAL-NAO-CLINICA — revisão sintética');
    await page.getByRole('button',{name:'Registrar revisão',exact:true}).click();
    await expect(page.getByRole('button',{name:'Publicar aula',exact:true})).toBeEnabled();
    await page.getByRole('button',{name:'Publicar aula',exact:true}).click();
    await expect(page.getByRole('button',{name:'Retirar aula de publicação',exact:true})).toBeVisible();
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath('editor-revisao.png'),fullPage:true});
    await page.getByRole('button',{name:'Voltar ao módulo',exact:true}).click();
    await page.getByRole('button',{name:'Publicar módulo',exact:true}).click();
    await expect(page.getByRole('button',{name:'Retirar módulo de publicação'})).toBeVisible();
    const persisted=await db.mentoryLesson.findUniqueOrThrow({where:{id:lessonId},include:{materials:true}});expect(persisted.videoAssetId).toBe('handoff-video');expect(persisted.captionsAssetId).toBe('handoff-captions');expect(persisted.status).toBe('PUBLISHED');expect(persisted.materials).toHaveLength(1);
    const student=await browser.newPage({viewport:page.viewportSize()!});
    await login(student,'mentory-test-student-b@iatron.test',`/mentory/aprender/${lessonId}`);
    await student.route(`**/api/mentory/lessons/${lessonId}/video?preview=0`,r=>r.fulfill({json:{kind:'mp4',url:'/handoff-clip.mp4'}}));
    await student.route('**/handoff-clip.mp4',r=>{const range=mediaRange(r.request().headers().range||null,clip.length);return r.fulfill({status:range?206:200,contentType:'video/mp4',headers:{'accept-ranges':'bytes',...(range?{'content-range':`bytes ${range.start}-${range.end}/${clip.length}`}:{})},body:range?clip.subarray(range.start,range.end+1):clip});});
    await student.getByRole('button',{name:'Reproduzir aula',exact:true}).click();await expect.poll(()=>student.locator('video').evaluate(v=>(v as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(1);
    await student.locator('video').evaluate(v=>(v as HTMLVideoElement).play());await expect.poll(()=>student.locator('video').evaluate(v=>(v as HTMLVideoElement).currentTime)).toBeGreaterThan(.3);await student.locator('video').evaluate(v=>(v as HTMLVideoElement).pause());
    await student.getByRole('spinbutton',{name:'Retomar no segundo'}).fill('10');await student.getByRole('button',{name:'Salvar posição',exact:true}).click();await expect(student.getByText('Progresso salvo.',{exact:true})).toBeVisible();await student.reload();await expect(student.getByRole('spinbutton',{name:'Retomar no segundo'})).toHaveValue('10');
    await student.getByRole('tab',{name:'Materiais',exact:true}).click();const download=student.waitForEvent('download');await student.getByRole('button',{name:'Abrir material',exact:true}).click();expect((await download).suggestedFilename()).toContain('MENTOR');
    await student.close();
  } finally { if(moduleId)await db.mentoryModule.deleteMany({where:{id:moduleId}}); }
});

test('Handoff: conflito de edição preserva o rascunho e API de conteúdo exige papel editorial',async({page})=>{
 await login(page,'mentory-test-student-b@iatron.test','/mentory/aprender');expect((await page.request.get('/api/mentory/admin/content')).status()).toBe(403);
 await login(page,'mentory-test-admin@iatron.test','/mentory/admin/conteudo');
 const record=await db.mentoryModule.create({data:{title:'Handoff conflito sintético',description:'Original'}});
 try{
  await page.goto(`/mentory/admin/conteudo?module=${record.id}`);await page.getByRole('button',{name:'Editar módulo',exact:true}).click();await page.getByRole('dialog').getByLabel('Título do módulo').fill('Alteração local preservada');
  await db.mentoryModule.update({where:{id:record.id},data:{description:'Edição concorrente'}});
  await page.getByRole('button',{name:'Salvar módulo em rascunho'}).click();await expect(page.locator('.field-error[role=alert], .editor-error[role=alert]')).toContainText('outra edição');await expect(page.getByRole('dialog').getByLabel('Título do módulo')).toHaveValue('Alteração local preservada');expect((await db.mentoryModule.findUniqueOrThrow({where:{id:record.id}})).title).toBe(record.title);
  page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 const lesson=await db.mentoryLesson.create({data:{moduleId:record.id,title:'Conflito de aula sintética',description:'Original',duration:60}});
 await db.mentoryLesson.update({where:{id:lesson.id},data:{description:'Edição concorrente da aula'}});
 const stale=await page.request.post('/api/mentory/admin',{headers:{origin:base},data:{action:'lesson.save',id:lesson.id,expectedUpdatedAt:lesson.updatedAt.toISOString(),moduleId:record.id,title:lesson.title,description:'Sobrescrita indevida',duration:60,videoAssetId:'',captionsAssetId:''}});expect(stale.status()).toBe(409);expect((await db.mentoryLesson.findUniqueOrThrow({where:{id:lesson.id}})).description).toBe('Edição concorrente da aula');
 }finally{await db.mentoryModule.deleteMany({where:{id:record.id}});}
});

test('Handoff: upload pode ser cancelado sem vincular arquivo parcial',async({page})=>{
 await login(page,'mentory-test-admin@iatron.test','/mentory/admin/conteudo?view=materiais');
 await page.getByRole('button',{name:'Abrir materiais',exact:true}).first().click();await page.getByRole('button',{name:'Voltar ao módulo',exact:true}).click();await page.getByRole('button',{name:'Todos os módulos',exact:true}).click();await page.getByRole('button',{name:'Módulos',exact:true}).click();await page.locator('.context-menu summary').first().click();await page.getByRole('button',{name:'Nova aula',exact:true}).click();await expect(page.getByLabel('Título da aula')).toBeVisible();await page.getByRole('button',{name:/Vídeo$/}).click();
 const clip=await readFile('assets/mentory-demo/lesson.mp4');let finish=0;
 await page.route('**/api/mentory/media/start',r=>r.fulfill({json:{id:'cancel-fixture',uploadUrl:base+'/slow-upload',contentType:'video/mp4'}}));
 await page.route('**/slow-upload',async r=>{await new Promise(resolve=>setTimeout(resolve,1200));await r.fulfill({status:200,body:''}).catch(()=>{});});
 page.on('request',r=>{if(r.url().includes('/media/finish'))finish++;});
 await page.getByLabel('Selecionar vídeo MP4',{exact:true}).setInputFiles({name:'cancelar.mp4',mimeType:'video/mp4',buffer:clip});await page.getByRole('button',{name:'Cancelar envio',exact:true}).click();await expect(page.getByText('Envio cancelado.',{exact:false})).toBeVisible();expect(finish).toBe(0);await expect(page.getByText('Arquivo privado disponível',{exact:true})).toHaveCount(0);await page.unrouteAll({behavior:'wait'});
});
