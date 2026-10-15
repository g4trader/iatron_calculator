"use client";
import { useState } from 'react';
export function MediaUpload({ kind, name, initial = '' }: { kind: 'video' | 'captions'; name: string; initial?: string }) {
  const [id, setId] = useState(initial); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setBusy(true); setMessage('Preparando envio privado…');
    try {
      const start = await fetch('/api/mentory/media/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, size: file.size }) });
      const session = await start.json(); if (!start.ok) throw new Error(session.error);
      const chunk = 8 * 1024 * 1024;
      for (let offset = 0; offset < file.size; offset += chunk) {
        const end = Math.min(offset + chunk, file.size);
        const response = await fetch(session.uploadUrl, { method: 'PUT', headers: { 'content-type': session.contentType, 'content-range': `bytes ${offset}-${end - 1}/${file.size}` }, body: file.slice(offset, end) });
        if (!response.ok && response.status !== 308) throw new Error('Envio interrompido. Selecione o arquivo novamente para tentar.');
        setMessage(`Enviado ${Math.round(end * 100 / file.size)}%`);
      }
      const finish = await fetch('/api/mentory/media/finish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: session.id }) });
      const verified = await finish.json(); if (!finish.ok) throw new Error(verified.error);
      setId(verified.id); setMessage('Arquivo privado verificado. Salve a aula para vinculá-lo.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Falha no envio.'); }
    finally { setBusy(false); }
  }
  return <div><label>{kind === 'video' ? 'Vídeo MP4 privado · até 2 GB (H.264/AAC)' : 'Legendas WebVTT · até 1 MB'}<input type="file" accept={kind === 'video' ? 'video/mp4,.mp4' : '.vtt,text/vtt'} disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); }}/></label><label>{kind === 'video' ? 'ID do vídeo' : 'ID das legendas'}<input name={name} value={id} onChange={e => setId(e.target.value)} pattern="[a-zA-Z0-9_\-]*" maxLength={200} readOnly={busy}/></label><p role="status">{message}</p></div>;
}
