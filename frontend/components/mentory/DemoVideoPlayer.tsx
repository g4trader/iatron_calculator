'use client';
import { playbackRates, playbackPreferenceKey } from '@/lib/mentory/account-validation';
import { useRef, useState, useEffect } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import chapters from '@/lib/mentory/demo-video-chapters.json';
const url = '/api/mentory/demo-video';
const time = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
export default function DemoVideoPlayer({ title, position, onPosition }: { title: string; position: number; onPosition: (seconds: number) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const initialPosition = useRef(position);
  const [status, setStatus] = useState('Pronto para reproduzir');
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState('1');
  useEffect(() => { try { const value=localStorage.getItem(playbackPreferenceKey); if(playbackRates.includes(value as typeof playbackRates[number])) {setRate(value!);if(video.current)video.current.playbackRate=Number(value);} } catch {} }, []);
  function fail() { setError(true); setReady(false); setStatus('Não foi possível carregar o vídeo. Verifique sua conexão e tente novamente.'); }
  function seek(seconds: number) { if (video.current && ready) { video.current.currentTime = Math.max(0, Math.min(seconds, duration)); onPosition(video.current.currentTime); } }
  return <section className="demo-video" aria-label="Player da videoaula">
    <div className="demo-video-heading"><span>VIDEOAULA · DEMONSTRAÇÃO</span><span>{duration ? `${time(duration)} · 720p` : 'Vídeo de apresentação'}</span></div>
    <video ref={video} controls playsInline preload="metadata" poster={`${url}?asset=poster`} aria-label={`Videoaula demonstrativa: ${title}`}
      onLoadedMetadata={e => { const el = e.currentTarget; setDuration(el.duration); setReady(true); setError(false); if (initialPosition.current > 0) el.currentTime = Math.min(initialPosition.current, Math.max(0, el.duration - 0.1)); el.playbackRate = Number(rate); }}
      onTimeUpdate={e => onPosition(e.currentTarget.currentTime)}
      onPlay={() => { setStatus('Reproduzindo'); }}
      onPause={() => { setStatus('Pausado · posição preservada nesta demonstração'); }}
      onWaiting={() => setStatus('Carregando vídeo…')}
      onPlaying={() => setStatus('Reproduzindo')}
      onEnded={() => { setStatus('Vídeo concluído. Você pode rever ou seguir para a próxima aula.'); }}
      onError={fail}>
      <source src={url} type="video/mp4" onError={fail}/>
      <track kind="captions" src={`${url}?asset=captions`} srcLang="pt-BR" label="Português" default/>
      Seu navegador não suporta vídeo HTML5.
    </video>
    <div className="demo-video-tools"><button className="btn btn-outline" disabled={!ready} onClick={() => seek((video.current?.currentTime || 0) - 10)} aria-label="Voltar 10 segundos"><RotateCcw size={16} aria-hidden="true"/>10 s</button><button className="btn btn-outline" disabled={!ready} onClick={() => seek((video.current?.currentTime || 0) + 10)} aria-label="Avançar 10 segundos"><RotateCw size={16} aria-hidden="true"/>10 s</button><label>Velocidade<select value={rate} onChange={e => { setRate(e.target.value); if (video.current) video.current.playbackRate = Number(e.target.value); }}>{['0.75', '1', '1.25', '1.5', '2'].map(r => <option key={r} value={r}>{r.replace('.', ',')}×</option>)}</select></label></div>
    <p className="notice" role="status" aria-live="polite">{status}</p>
    {error && <button className="btn btn-outline" onClick={() => { initialPosition.current = position; setError(false); setStatus('Carregando vídeo…'); video.current?.load(); }}>Tentar carregar novamente</button>}
    <details className="video-details"><summary>Capítulos e informações do vídeo</summary><nav className="demo-video-chapters" aria-label="Capítulos do vídeo">{chapters.map(chapter => <button className="btn btn-outline" disabled={!ready} key={chapter.start} onClick={() => seek(chapter.start)}>{time(chapter.start)} · {chapter.title}</button>)}</nav>
    <p className="notice">Vídeo original de apresentação com narração sintética e legendas em português. A mesma amostra aparece nas aulas do mockup; não é uma aula clínica. Volume, legendas e tela cheia ficam nos controles do vídeo, conforme o navegador.</p>
    </details>
  </section>;
}
