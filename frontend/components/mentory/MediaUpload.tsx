'use client';
import { useEffect, useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, X } from 'lucide-react';

type Props = { kind: 'video' | 'captions'; name: string; initial?: string; onChange?: (id: string) => void; onDuration?: (seconds: number) => void; onBusy?: (busy: boolean) => void };
export function MediaUpload({ kind, name, initial = '', onChange, onDuration, onBusy }: Props) {
  const [id, setId] = useState(initial); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(0); const [preview, setPreview] = useState(''); const [filename, setFilename] = useState('');
  const fileRef = useRef<File | null>(null); const controller = useRef<AbortController | null>(null); const xhr = useRef<XMLHttpRequest | null>(null); const input = useRef<HTMLInputElement>(null); const duration = useRef(0); const verifiedUpload = useRef(false);
  const limit = kind === 'video' ? 2_000_000_000 : 1_000_000;
  useEffect(() => () => { controller.current?.abort(); xhr.current?.abort(); }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function cancel() { controller.current?.abort(); xhr.current?.abort(); }
  async function upload(file: File) {
    if (busy) return;
    fileRef.current = file; setError(''); setMessage(''); duration.current = 0; verifiedUpload.current = false;
    if (file.size < 8 || file.size > limit || !(kind === 'video' ? /\.mp4$/i : /\.vtt$/i).test(file.name)) { setError(kind === 'video' ? 'Selecione um vídeo MP4 de até 2 GB.' : 'Selecione legendas WebVTT de até 1 MB.'); return; }
    const head = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    if (!(kind === 'video' ? new TextDecoder().decode(head.slice(4, 8)) === 'ftyp' : /^\uFEFF?WEBVTT(?:[ \t]|\r?\n)/.test(new TextDecoder().decode(head)))) { setError('O conteúdo do arquivo não corresponde ao formato informado.'); return; }
    const abort = new AbortController(); controller.current = abort; setBusy(true); onBusy?.(true); setProgress(0); setFilename(file.name);
    if (kind === 'video') setPreview(URL.createObjectURL(file));
    try {
      setMessage('Preparando envio privado…');
      const start = await fetch('/api/mentory/media/start', { method: 'POST', signal: abort.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, size: file.size }) });
      const session = await start.json(); if (!start.ok) throw new Error(start.status === 401 ? 'Sua sessão expirou. Entre novamente para enviar.' : session.error);
      const chunk = 8 * 1024 * 1024;
      for (let offset = 0; offset < file.size; offset += chunk) {
        if (abort.signal.aborted) throw new DOMException('Cancelado', 'AbortError');
        const end = Math.min(offset + chunk, file.size); setMessage('Enviando arquivo…');
        await new Promise<void>((resolve, reject) => {
          const request = new XMLHttpRequest(); xhr.current = request; request.open('PUT', session.uploadUrl); request.timeout = 120000;
          request.setRequestHeader('Content-Type', session.contentType); request.setRequestHeader('Content-Range', `bytes ${offset}-${end - 1}/${file.size}`);
          request.upload.onprogress = event => { if (event.lengthComputable) setProgress(Math.min(100, Math.round((offset + event.loaded) * 100 / file.size))); };
          request.onload = () => request.status >= 200 && request.status < 300 || request.status === 308 ? resolve() : reject(new Error('O envio foi interrompido. Tente novamente.'));
          request.onerror = request.ontimeout = () => reject(new Error('Falha de conexão durante o envio. Tente novamente.'));
          request.onabort = () => reject(new DOMException('Cancelado', 'AbortError'));
          request.send(file.slice(offset, end));
        });
        setProgress(Math.round(end * 100 / file.size));
      }
      setMessage('Verificando formato e integridade…');
      const finish = await fetch('/api/mentory/media/finish', { method: 'POST', signal: abort.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: session.id }) });
      const verified = await finish.json(); if (!finish.ok) throw new Error(verified.error);
      verifiedUpload.current = true; setId(verified.id); onChange?.(verified.id); if (duration.current > 0) onDuration?.(Math.round(duration.current));
      setMessage('Arquivo verificado. Salve a aula para concluir o vínculo.');
    } catch (e) { if (abort.signal.aborted) setMessage('Envio cancelado. O arquivo anterior permanece vinculado até salvar uma substituição.'); else setError(e instanceof Error ? e.message : 'Não foi possível enviar. Tente novamente.'); }
    finally { setBusy(false); onBusy?.(false); xhr.current = null; controller.current = null; }
  }
  return <section className="media-upload" aria-label={kind === 'video' ? 'Upload de vídeo' : 'Upload de legendas'}>
    <input type="hidden" name={name} value={id}/>
    <div className="upload-drop" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file && !busy) void upload(file); }}>
      <UploadCloud size={32} aria-hidden="true"/>
      <label>{kind === 'video' ? 'Selecionar vídeo MP4' : 'Selecionar legendas VTT'}<input ref={input} type="file" accept={kind === 'video' ? 'video/mp4,.mp4' : '.vtt,text/vtt'} disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ''; }}/></label>
      <p>Arraste o arquivo para esta área ou selecione acima.</p><small>{kind === 'video' ? 'MP4 · até 2 GB · H.264/AAC. Sem conversão automática.' : 'WebVTT · até 1 MB · legendas em português.'}</small>
    </div>
    {filename && <p className="upload-filename">{filename}</p>}
    {busy && <div className="upload-progress"><progress value={progress} max={100} aria-label="Progresso do envio"/><span>{progress}%</span><button type="button" className="btn btn-outline" onClick={cancel}><X size={16} aria-hidden="true"/>Cancelar envio</button></div>}
    {!busy && id && <p className="upload-confirmation"><CheckCircle2 size={18} aria-hidden="true"/>Arquivo privado disponível</p>}
    <p role="status" aria-live="polite">{message}</p>{error && <p className="field-error" role="alert">{error}</p>}
    {error && fileRef.current && !busy && <button type="button" className="btn btn-outline" onClick={() => void upload(fileRef.current!)}>Tentar envio novamente</button>}
    {preview && <div className="upload-preview"><p>Prévia local do arquivo selecionado</p><video controls playsInline preload="metadata" src={preview} aria-label="Prévia do vídeo selecionado" onLoadedMetadata={e => { const seconds = e.currentTarget.duration; if (Number.isFinite(seconds) && seconds <= 86400) { duration.current = seconds; if (verifiedUpload.current) onDuration?.(Math.round(seconds)); } }} onError={() => setError('Este navegador não reproduziu a prévia. Verifique se o MP4 usa H.264/AAC antes de publicar.')}/></div>}
  </section>;
}
