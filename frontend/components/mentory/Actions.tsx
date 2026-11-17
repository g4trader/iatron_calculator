'use client';
import Hls from 'hls.js';
import { useState, useRef, useEffect } from 'react';
import { playbackRates, playbackPreferenceKey } from '@/lib/mentory/account-validation';
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
export function VideoPlayer({ id, preview, position, posterVersion = 0 }: { id: string; preview: boolean; position: number; posterVersion?: number }) {
  const video = useRef<HTMLVideoElement>(null);
  const [posterFailed,setPosterFailed]=useState(false);
  const poster='/api/mentory/lessons/'+encodeURIComponent(id)+'/thumbnail?preview='+(preview?'1':'0')+'&v='+posterVersion;
  useEffect(()=>setPosterFailed(false),[poster]);
  const [rate, setRate] = useState('1');
  useEffect(() => { try { const value=localStorage.getItem(playbackPreferenceKey); if(playbackRates.includes(value as typeof playbackRates[number])) setRate(value!); } catch {} }, []);
  const [ready, setReady] = useState(false);
  function seek(delta: number) { if (video.current && Number.isFinite(video.current.duration)) video.current.currentTime = Math.max(0, Math.min(video.current.duration, video.current.currentTime + delta)); }
  const [media, setMedia] = useState<{ url: string; kind: string; captions?: string; watermark?: string } | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const resume = useRef(position);
  useEffect(() => {
    if (media?.kind !== 'hls' || !video.current) return;
    const el = video.current;
    if (el.canPlayType('application/vnd.apple.mpegurl')) { el.src = media.url; return () => { el.removeAttribute('src'); el.load(); }; }
    if (!Hls.isSupported()) { setError('Este navegador não suporta streaming HLS.'); setMedia(null); return; }
    const hls = new Hls({ maxBufferLength: 30 });
    hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) { setReady(false); setError('Reprodução interrompida. Solicite novo acesso.'); setMedia(null); } });
    hls.loadSource(media.url); hls.attachMedia(el);
    return () => hls.destroy();
  }, [media]);
  async function play() {
    setBusy(true); setError('');
    try { const r = await fetch(`/api/mentory/lessons/${id}/video?preview=${preview ? '1' : '0'}`); const data = await r.json(); if (!r.ok) throw new Error(data.error); setMedia(data); }
    catch(e) { setError(e instanceof Error ? e.message : 'Vídeo indisponível.'); }
    finally { setBusy(false); }
  }
  return <><div className="player" style={{position:"relative"}}>{(media?.kind === 'mp4' || media?.kind === 'hls') ? <video ref={video} key={media.url} controls controlsList="nodownload noremoteplayback" disablePictureInPicture playsInline poster={posterFailed?undefined:poster} preload="metadata" aria-label="Vídeo da aula" onLoadedMetadata={e => { setReady(true); e.currentTarget.playbackRate = Number(rate); e.currentTarget.currentTime = Math.min(resume.current, e.currentTarget.duration || 0); }} onTimeUpdate={e => { resume.current = e.currentTarget.currentTime; }} onError={() => { setReady(false); setMedia(null); setError('O acesso temporário expirou ou o formato não é compatível. Tente reproduzir novamente.'); }}>{media.kind === 'mp4' && <source src={media.url} type="video/mp4"/>}{media.captions && <track kind="captions" src={media.captions} srcLang="pt-BR" label="Português" default/>}Seu navegador não suporta vídeo HTML5.</video> : media ? <iframe src={`${media.url}?startTime=${position}s`} title="Vídeo da aula — controles e legendas do provedor" allow="fullscreen; picture-in-picture" allowFullScreen/> : <div className="player-inner" style={{position:"relative",isolation:"isolate",overflow:"hidden"}}>{!posterFailed&&<><img src={poster} alt="" onError={()=>setPosterFailed(true)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:-2}}/><span aria-hidden="true" style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",zIndex:-1}}/></>}<strong>Sua sala de aula</strong><span>Vídeo protegido • legendas quando disponíveis</span><button className="btn" disabled={busy} onClick={play}>Reproduzir aula</button><p role="status">{error}</p></div>}{media?.watermark&&<span aria-hidden="true" style={{position:"absolute",top:"12%",right:"6%",color:"white",background:"rgba(0,0,0,.35)",padding:"4px 8px",fontSize:"12px",pointerEvents:"none",zIndex:2}}>{media.watermark}</span>}</div>{(media?.kind === 'mp4' || media?.kind === 'hls') && <div className="demo-video-tools"><button className="btn btn-outline" disabled={!ready} onClick={() => seek(-10)} aria-label="Voltar 10 segundos">−10 s</button><button className="btn btn-outline" disabled={!ready} onClick={() => seek(10)} aria-label="Avançar 10 segundos">+10 s</button><label>Velocidade<select value={rate} onChange={e => { setRate(e.target.value); if (video.current) video.current.playbackRate = Number(e.target.value); }}>{['0.75', '1', '1.25', '1.5', '2'].map(value => <option key={value} value={value}>{value.replace('.', ',')}×</option>)}</select></label></div>}</>;
}
