'use client';
import { useEffect } from 'react';
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    const leave = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute('download') || anchor.target === '_blank' || anchor.href === location.href) return;
      if (!confirm('Há alterações não salvas. Sair e descartá-las?')) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', unload); document.addEventListener('click', leave, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', leave, true); };
  }, [dirty]);
}
export async function editorialRequest(body: Record<string, unknown>) {
  const response = await fetch('/api/mentory/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(response.status === 401 ? 'Sua sessão expirou. Entre novamente para salvar.' : data.error || 'Não foi possível salvar. Tente novamente.');
  return data as { id: string };
}
export type Material = { id: string; title: string; type: string; body: string; storageKey: string | null };
export type Lesson = { id: string; moduleId: string; title: string; description: string; duration: number; videoAssetId: string | null; captionsAssetId: string | null; status: string; reviewReference: string | null; reviewedAt: string | null; updatedAt: string; materials: Material[] };
export type Module = { id: string; title: string; description: string; status: string; updatedAt: string; lessons: Lesson[] };
