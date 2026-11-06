import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { identity } from '@/lib/mentory/server';
import { MentoryError } from '@/lib/mentory/domain';
import { mediaRange } from '@/lib/mentory/media-range';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const assets = { video: ['lesson.mp4', 'video/mp4'], captions: ['captions.vtt', 'text/vtt; charset=utf-8'], poster: ['poster.jpg', 'image/jpeg'] } as const;
async function serve(req: NextRequest) {
  try {
    const actor = await identity();
    if (!actor.editor) throw new MentoryError(403, 'Demonstração restrita à equipe Ped Expert Mentory.');
    const asset = req.nextUrl.searchParams.get('asset') || 'video';
    if (!Object.hasOwn(assets, asset)) throw new MentoryError(404, 'Arquivo indisponível.');
    const [filename, contentType] = assets[asset as keyof typeof assets];
    const bytes = await readFile(path.join(process.cwd(), 'assets', 'mentory-demo', filename));
    const range = mediaRange(req.headers.get('range'), bytes.length);
    const common = { ...headers, 'Content-Type': contentType, 'Accept-Ranges': 'bytes' };
    if (range === false) return new NextResponse(null, { status: 416, headers: { ...common, 'Content-Range': `bytes */${bytes.length}` } });
    const body = range ? bytes.subarray(range.start, range.end + 1) : bytes;
    return new NextResponse(req.method === 'HEAD' ? null : new Uint8Array(body), { status: range ? 206 : 200, headers: { ...common, 'Content-Length': String(body.length), ...(range ? { 'Content-Range': `bytes ${range.start}-${range.end}/${bytes.length}` } : {}) } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof MentoryError ? error.message : 'Vídeo demonstrativo indisponível. Tente novamente.' }, { status: error instanceof MentoryError ? error.status : 503, headers });
  }
}
export const GET = serve;
export const HEAD = serve;
