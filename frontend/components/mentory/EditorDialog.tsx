'use client';
import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
export default function EditorDialog({ title, children, close }: { title: string; children: React.ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null); const id = useId();
  useEffect(() => {
    const modal = ref.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal?.showModal();
    return () => { modal?.close(); if (previous?.isConnected && !modal?.contains(previous)) previous.focus(); };
  }, []);
  return <dialog ref={ref} className="editor-dialog" aria-labelledby={id} onKeyDown={e => {
    if (e.key !== 'Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
    const controls = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(node => node.getClientRects().length);
    // Safari may skip native buttons with its default keyboard preferences.
    // Traverse every available dialog control consistently in both directions.
    if (!controls.length) return;
    e.preventDefault();
    const index = controls.indexOf(document.activeElement as HTMLElement);
    const next = index < 0 ? (e.shiftKey ? controls.length - 1 : 0) : (index + (e.shiftKey ? -1 : 1) + controls.length) % controls.length;
    controls[next].focus();
  }} onCancel={e => { e.preventDefault(); close(); }}><header><h2 id={id}>{title}</h2><button type="button" className="icon-button" aria-label="Fechar formulário" onClick={close}><X size={20}/></button></header>{children}</dialog>;
}
