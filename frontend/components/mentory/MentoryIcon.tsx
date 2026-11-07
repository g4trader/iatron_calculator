import type { ReactNode, SVGProps } from "react";

type Name = "mentor" | "book" | "cases" | "award" | "layers" | "calendar" | "shield" | "rocket";
export function MentoryIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: Name }) {
  const paths: Record<Name, ReactNode> = {
    mentor: <><rect x="3" y="3" width="18" height="15" rx="2"/><circle cx="12" cy="9" r="2"/><path d="M8 15c.5-2.5 7.5-2.5 8 0M8 22h8m-4-4v4"/></>,
    book: <><path d="M12 6c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1Z"/><path d="M12 6v14"/></>,
    cases: <><circle cx="12" cy="7" r="3"/><path d="M6 20v-2a6 6 0 0 1 12 0v2H6Z"/><circle cx="4" cy="9" r="2"/><path d="M1 19v-2c0-2 1-3 3-4M20 9a2 2 0 1 0 0-4m0 8c2 1 3 2 3 4v2"/></>,
    award: <><path d="m12 2 2.5 1.4 2.9-.1 1.3 2.6 2.5 1.5-.3 2.9 1.1 2.7-2 2.1-.6 2.9-2.8.6-2 2.1-2.6-1.1-2.6 1.1-2-2.1-2.8-.6-.6-2.9-2-2.1 1.1-2.7-.3-2.9 2.5-1.5 1.3-2.6 2.9.1Z"/><path d="m8 11 3 3 5-5M8 21l-1 2m9-2 1 2"/></>,
    layers: <><path d="m12 2 10 5-10 5L2 7l10-5Zm-10 10 10 5 10-5M2 17l10 5 10-5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18"/></>,
    shield: <><path d="m12 2 9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6l9-4Z"/><path d="m8 12 3 3 5-6"/></>,
    rocket: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.07 2.07 0 0 0-2.91-.09Z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6.05 11A22 22 0 0 1 12 15Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/><circle cx="16" cy="8" r="2"/></>
  };
  return <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
