"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Attachment = {
  id: string;
  fileName: string;
  contentType: string;
  byteSize: number | null;
  status: string;
  uploadedAt: string | null;
};

type UploadResponse = {
  attachmentId: string;
  method: "PUT";
  url: string;
  headers: Record<string, string>;
};

function formatBytes(value: number | null) {
  if (!value) return "-";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function ManualPaymentAttachmentUploader({ paymentId, attachments }: { paymentId: string; attachments: Attachment[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function uploadAttachment() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setStatus("Selecione um arquivo PDF, PNG, JPG ou WEBP.");
      return;
    }
    setBusy(true);
    setStatus("Preparando upload privado...");
    try {
      const response = await fetch(`/api/admin/payments-manual/${paymentId}/attachments/upload-url`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, byteSize: file.size })
      });
      const payload = (await response.json()) as UploadResponse | { error?: string };
      if (!response.ok || !("url" in payload)) throw new Error("error" in payload ? payload.error : "Falha ao criar URL de upload.");

      setStatus("Enviando comprovante para storage privado...");
      const upload = await fetch(payload.url, {
        method: payload.method,
        headers: {
          ...payload.headers,
          "content-type": file.type
        },
        body: file
      });
      if (!upload.ok) throw new Error(`Falha no upload direto: ${upload.status}`);

      setStatus("Finalizando rastreabilidade do comprovante...");
      const complete = await fetch(`/api/admin/payments-manual/${paymentId}/attachments/${payload.attachmentId}/complete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      });
      const completePayload = (await complete.json().catch(() => ({}))) as { error?: string };
      if (!complete.ok) throw new Error(completePayload.error ?? "Falha ao finalizar comprovante.");

      setStatus("Comprovante anexado com auditoria.");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Falha ao anexar comprovante.");
    } finally {
      setBusy(false);
    }
  }

  async function openAttachment(attachmentId: string) {
    setBusy(true);
    setStatus("Gerando acesso temporário ao comprovante...");
    try {
      const response = await fetch(`/api/admin/payments-manual/${paymentId}/attachments/${attachmentId}/download-url`, { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Falha ao gerar acesso ao comprovante.");
      window.open(payload.url, "_blank", "noopener,noreferrer");
      setStatus("Link privado aberto em nova aba.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Falha ao abrir comprovante.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-lg border border-cyan-300/10 bg-slate-900/35 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white">Upload privado</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">PDF, PNG, JPG ou WEBP até 8 MB. O arquivo não passa pelo servidor da aplicação.</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={uploadAttachment}
            className="h-9 rounded-md bg-cyan-300 px-3 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anexar comprovante
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="block w-full rounded-md border border-cyan-300/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-300 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-slate-950"
        />
        {status ? <p className="text-xs font-bold text-cyan-100">{status}</p> : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-cyan-300/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="p-3">Arquivo</th>
              <th className="p-3">Status</th>
              <th className="p-3">Tamanho</th>
              <th className="p-3">Upload</th>
              <th className="p-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-300/10">
            {attachments.length ? attachments.map((attachment) => (
              <tr key={attachment.id} className="text-slate-300">
                <td className="p-3 font-bold">{attachment.fileName}</td>
                <td className="p-3">{attachment.status}</td>
                <td className="p-3">{formatBytes(attachment.byteSize)}</td>
                <td className="p-3">{attachment.uploadedAt ? new Date(attachment.uploadedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-"}</td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    disabled={busy || attachment.status !== "UPLOADED"}
                    onClick={() => openAttachment(attachment.id)}
                    className="rounded-md border border-cyan-300/20 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Abrir
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-4 text-sm font-semibold text-slate-500">Nenhum comprovante anexado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
