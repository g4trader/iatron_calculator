'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
export type LessonTab = { id: string; label: string; content: ReactNode; mobileOnly?: boolean };
/** Mounted panels preserve forms, material readers and scroll-independent video state. */
export default function LessonTabs({ tabs }: { tabs: LessonTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const prefix = useId();
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const query = matchMedia('(min-width: 1200px)');
    const change = () => { if (query.matches && tabs.find(t => t.id === active)?.mobileOnly) setActive(tabs[0].id); };
    change(); query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, [active, tabs]);
  return <section className="lesson-tabs"><div className="lesson-tabbar" ref={bar} role="tablist" aria-label="Conteúdo da aula" onKeyDown={event => {
    const buttons = Array.from(bar.current?.querySelectorAll<HTMLButtonElement>('[role=tab]') || []).filter(el => el.getClientRects().length);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const target = event.key === 'ArrowRight' ? (index + 1) % buttons.length : event.key === 'ArrowLeft' ? (index - 1 + buttons.length) % buttons.length : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : -1;
    if (target >= 0) { event.preventDefault(); buttons[target].click(); buttons[target].focus(); }
  }}>{tabs.map(tab => <button key={tab.id} type="button" id={`${prefix}-${tab.id}`} role="tab" aria-selected={active === tab.id} aria-controls={`${prefix}-${tab.id}-panel`} tabIndex={active === tab.id ? 0 : -1} className={tab.mobileOnly ? 'trail-mobile' : undefined} onClick={() => setActive(tab.id)}>{tab.label}</button>)}</div>{tabs.map(tab => <div key={tab.id} id={`${prefix}-${tab.id}-panel`} role="tabpanel" aria-labelledby={`${prefix}-${tab.id}`} tabIndex={0} hidden={active !== tab.id}>{tab.content}</div>)}</section>;
}
