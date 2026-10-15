'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
export function MaterialAccess({ id, preview = false }: { id: string; preview?: boolean }) {
  const [body, setBody] = useState(''); const [busy, setBusy] = useState(false);
  return <div><button className="btn btn-outline" disabled={busy} onClick={async () => { setBusy(true); try { const r = await fetch(`/api/mentory/materials/${id}?preview=${preview ? '1' : '0'}`); const data = await r.json(); if (!r.ok) throw new Error(data.error); if (data.url) window.location.assign(data.url); else setBody(data.body || 'Texto ainda não cadastrado.'); } catch (e) { setBody(e instanceof Error ? e.message : 'Falha ao abrir material.'); } finally { setBusy(false); } }}>Abrir material</button>{body && <p className="text-body" role="status">{body}</p>}</div>;
}
export function ProgressControl({ id, duration, position, completed }: { id: string; duration: number; position: number; completed: boolean }) {
  const [seconds, setSeconds] = useState(position); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const router = useRouter();
  async function save(done?: boolean) { setBusy(true); try { const r = await fetch(`/api/mentory/lessons/${id}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lastPositionSeconds: seconds, ...(done === undefined ? {} : { completed: done }) }) }); const data = await r.json(); if (!r.ok) throw new Error(data.error); setMessage('Progresso salvo.'); router.refresh(); } catch(e) { setMessage(e instanceof Error ? e.message : 'Falha ao salvar.'); } finally { setBusy(false); } }
  return <section className="panel"><h3>Seu progresso</h3><label>Retomar no segundo<input type="number" min={0} max={duration} value={seconds} onChange={e => setSeconds(Number(e.target.value))}/></label><div className="row-actions"><button className="btn btn-outline" disabled={busy} onClick={() => save()}>Salvar posição</button><button className="btn btn-primary" disabled={busy} onClick={() => save(!completed)}>{completed ? 'Marcar como não concluída' : 'Marcar como concluída'}</button></div><p role="status">{message}</p></section>;
}
export function VideoPlayer({ id, preview, position }: { id: string; preview: boolean; position: number }) {
  const [media, setMedia] = useState<{ url: string; kind: string; captions?: string } | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const resume = useRef(position);
  async function play() {
    setBusy(true); setError('');
    try { const r = await fetch(`/api/mentory/lessons/${id}/video?preview=${preview ? '1' : '0'}`); const data = await r.json(); if (!r.ok) throw new Error(data.error); setMedia(data); }
    catch(e) { setError(e instanceof Error ? e.message : 'Vídeo indisponível.'); }
    finally { setBusy(false); }
  }
  return <><div className="player">{media?.kind === 'mp4' ? <video key={media.url} controls playsInline preload="metadata" aria-label="Vídeo da aula" onLoadedMetadata={e => { e.currentTarget.currentTime = Math.min(resume.current, e.currentTarget.duration || 0); }} onTimeUpdate={e => { resume.current = e.currentTarget.currentTime; }} onError={() => { setMedia(null); setError('O acesso temporário expirou ou o formato não é compatível. Tente reproduzir novamente.'); }}><source src={media.url} type="video/mp4"/>{media.captions && <track kind="captions" src={media.captions} srcLang="pt-BR" label="Português" default/>}Seu navegador não suporta vídeo HTML5.</video> : media ? <iframe src={`${media.url}?startTime=${position}s`} title="Vídeo da aula — controles e legendas do provedor" allow="fullscreen; picture-in-picture" allowFullScreen/> : <div className="player-inner"><strong>Sua sala de aula</strong><span>Vídeo protegido • legendas quando disponíveis</span><button className="btn" disabled={busy} onClick={play}>Reproduzir aula</button><p role="status">{error}</p></div>}</div></>;
}
