import { beginMediaUpload, finishMediaUpload, readCaptions } from '@/lib/mentory/gcs-video';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { identity, lessonAccess, subscriptionFor, adminData } from '@/lib/mentory/server';
import { MentoryError, mentoryPayment } from '@/lib/mentory/domain';
import { openCommunity, saveCommunity } from '@/lib/mentory/community';
import { mutate } from '@/lib/mentory/mutations';
import { assetSignature, verifyAssetSignature, videoPlayback } from '@/lib/mentory/assets';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
async function limited(userId: string, write: boolean) {
  const window = Math.floor(Date.now() / 60000);
  const key = `mentory:${userId}:${write ? 'write' : 'read'}:${window}`;
  const bucket = await prisma.mentoryRateBucket.upsert({ where: { key }, create: { key, count: 1, resetAt: new Date((window + 1) * 60000) }, update: { count: { increment: 1 } } });
  if (bucket.count > (write ? 60 : 120)) throw new MentoryError(429, 'Muitas solicitações. Tente em um minuto.');
  if (bucket.count === 1) await prisma.mentoryRateBucket.deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 86400000) } } });
}
async function run(req: NextRequest, context: { params: Promise<{ path?: string[] }> }, write: boolean) {
  try {
    const actor = await identity();
    if (write) {
      const origin = req.headers.get('origin');
      const host = req.headers.get('host');
      const local = host === '127.0.0.1:3000' || host === 'localhost:3000';
      if (!origin || origin !== `${local ? 'http' : 'https'}://${host}`) throw new MentoryError(403, 'Origem inválida. Atualize a página.');
    }
    await limited(actor.id, write);
    const path = (await context.params).path || [];
    const preview = req.nextUrl.searchParams.get('preview') === '1';
    if (req.nextUrl.searchParams.has('userId')) throw new MentoryError(403, 'Consulta restrita ao titular autenticado.');
    if (write && path.join('/') === 'community/settings') return json(await saveCommunity(actor, await req.json()));
    if (write && path.join('/') === 'community/join') return json(await openCommunity(actor, await req.json()));
    if (!write && path.join('/') === 'admin/content') return json(await adminData(actor, undefined, 'conteudo'));
    if (write && path.join('/') === 'admin') return json(await mutate(actor, await req.json()));
    if (write && path.join('/') === 'checkout') return json(await mentoryPayment.checkout());
    if (write && ['media/start', 'media/finish'].includes(path.join('/'))) {
      if (!actor.editor) throw new MentoryError(403, 'Permissão editorial necessária.');
      const body = await req.json();
      if (path[1] === 'start') {
        const result = await beginMediaUpload(actor.id, body.kind, body.size, req.headers.get('origin')!);
        await prisma.mentoryAuditLog.create({ data: { actorId: actor.id, action: 'media.upload.start', entityId: result.id, metadata: { kind: body.kind, byteSize: body.size } } });
        return json(result);
      }
      if (typeof body.id !== 'string') throw new MentoryError(400, 'Identificador de mídia obrigatório.');
      const result = await finishMediaUpload(actor.id, body.id);
      await prisma.mentoryAuditLog.create({ data: { actorId: actor.id, action: 'media.upload.verified', entityId: result.id, metadata: { kind: result.kind, byteSize: result.byteSize } } });
      return json(result);
    }
    if (write && path.join('/') === 'upload') {
      if (!actor.editor) throw new MentoryError(403, 'Permissão editorial necessária.');
      if (Number(req.headers.get('content-length') || 0) > 3_200_000) throw new MentoryError(413, 'O limite é 3 MB por PDF.');
      const form = await req.formData(); const file = form.get('file');
      if (!(file instanceof File) || file.size > 3_000_000 || file.size < 8 || file.type !== 'application/pdf') throw new MentoryError(400, 'Envie um PDF de até 3 MB. Exporte slides como PDF.');
      const content = Buffer.from(await file.arrayBuffer());
      if (!content.subarray(0, 5).equals(Buffer.from('%PDF-')) || /\/(JavaScript|JS|Launch|EmbeddedFile|OpenAction|AA)\b/i.test(content.toString('latin1'))) throw new MentoryError(400, 'PDF inválido ou com conteúdo ativo não permitido.');
      const asset = await prisma.$transaction(async tx => {
        const row = await tx.mentoryPrivateAsset.create({ data: { content, contentType: 'application/pdf', byteSize: content.length, checksum: createHash('sha256').update(content).digest('hex') }, select: { id: true } });
        await tx.mentoryAuditLog.create({ data: { actorId: actor.id, action: 'asset.upload', entityId: row.id } }); return row;
      });
      return json({ storageKey: asset.id });
    }
    if (!write && path.join('/') === 'subscription') return json(await subscriptionFor(actor.id));
    if (!write && path.join('/') === 'progress') return json(await prisma.mentoryLessonProgress.findMany({ where: { userId: actor.id } }));
    if (path[0] === 'lessons' && path[1]) {
      const lesson = await lessonAccess(actor, path[1], preview);
      if (!write && path[2] === 'video') {
        const subscription = await subscriptionFor(actor.id);
        return json({ url: await videoPlayback(lesson.videoAssetId, preview ? new Date(Date.now() + 300000) : subscription!.expiresAt), kind: lesson.videoAssetId?.startsWith('gcs_') ? 'mp4' : 'iframe', captions: lesson.captionsAssetId?.startsWith('gcs_') ? `/api/mentory/lessons/${lesson.id}/captions?preview=${preview ? '1' : '0'}` : null });
      }
      if (!write && path[2] === 'captions') {
        if (!lesson.captionsAssetId?.startsWith('gcs_')) throw new MentoryError(404, 'Legendas não cadastradas.');
        return new NextResponse(await readCaptions(lesson.captionsAssetId), { headers: { ...headers, 'Content-Type': 'text/vtt; charset=utf-8', 'Content-Security-Policy': "default-src 'none'" } });
      }
      if (write && path[2] === 'progress') {
        if (preview) throw new MentoryError(403, 'Preview não altera progresso.');
        const body = await req.json();
        if (Object.keys(body).some(k => !['completed', 'lastPositionSeconds'].includes(k)) || (body.completed !== undefined && typeof body.completed !== 'boolean') || !Number.isInteger(body.lastPositionSeconds) || body.lastPositionSeconds < 0 || body.lastPositionSeconds > lesson.duration) throw new MentoryError(400, 'Progresso inválido.');
        const completedAt = body.completed === undefined ? undefined : body.completed ? new Date() : null;
        return json(await prisma.mentoryLessonProgress.upsert({ where: { userId_lessonId: { userId: actor.id, lessonId: lesson.id } }, create: { userId: actor.id, lessonId: lesson.id, lastPositionSeconds: body.lastPositionSeconds, completedAt }, update: { lastPositionSeconds: body.lastPositionSeconds, completedAt } }));
      }
    }
    if (!write && path[0] === 'materials' && path[1]) {
      const material = await prisma.mentoryMaterial.findUnique({ where: { id: path[1] } });
      if (!material) throw new MentoryError(404, 'Material indisponível.');
      await lessonAccess(actor, material.lessonId, preview);
      if (path[2] === 'download') {
        const expiry = Number(req.nextUrl.searchParams.get('expires'));
        if (!verifyAssetSignature(actor.id, material.id, expiry, preview, req.nextUrl.searchParams.get('signature') || '')) throw new MentoryError(403, 'Link inválido ou expirado. Solicite um novo acesso.');
        if (!material.storageKey) throw new MentoryError(404, 'Arquivo indisponível.');
        const asset = await prisma.mentoryPrivateAsset.findUniqueOrThrow({ where: { id: material.storageKey } });
        return new NextResponse(new Uint8Array(asset.content), { headers: { ...headers, 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="material-MENTOR.iatron.pdf"', 'Content-Security-Policy': "sandbox; default-src 'none'" } });
      }
      if (material.type === 'TEXT') return json({ title: material.title, body: material.body });
      const expiry = Date.now() + 60000;
      return json({ url: `/api/mentory/materials/${material.id}/download?expires=${expiry}&preview=${preview ? '1' : '0'}&signature=${assetSignature(actor.id, material.id, expiry, preview)}` });
    }
    throw new MentoryError(404, 'Recurso indisponível.');
  } catch (e) {
    if (e instanceof MentoryError) return json({ error: e.message }, e.status);
    if (e instanceof SyntaxError) return json({ error: 'Solicitação inválida.' }, 400);
    return json({ error: 'Não foi possível concluir. Atualize a página e tente novamente.' }, 500);
  }
}
export const GET = (r: NextRequest, c: { params: Promise<{ path?: string[] }> }) => run(r, c, false);
export const POST = (r: NextRequest, c: { params: Promise<{ path?: string[] }> }) => run(r, c, true);
