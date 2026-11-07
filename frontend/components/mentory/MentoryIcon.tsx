import type { SVGProps } from "react";

type Name = "mentor" | "book" | "cases" | "award" | "layers" | "calendar" | "shield" | "rocket";
export function MentoryIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: Name }) {
  const paths: Record<Name, React.ReactNode> = {
    mentor: <><rect x="3" y="3" width="18" height="15" rx="2"/><circle cx="12" cy="9" r="2"/><path d="M8 15c.5-2.5 7.5-2.5 8 0M8 22h8m-4-4v4"/></>,
    book: <><path d="M12 6c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1Z"/><path d="M12 6v14"/></>,
    cases: <><circle cx="12" cy="7" r="3"/><path d="M6 20v-2a6 6 0 0 1 12 0v2H6Z"/><circle cx="4" cy="9" r="2"/><path d="M1 19v-2c0-2 1-3 3-4M20 9a2 2 0 1 0 0-4m0 8c2 1 3 2 3 4v2"/></>,
    award: <><path d="m12 2 2.5 1.4 2.9-.1 1.3 2.6 2.5 1.5-.3 2.9 1.1 2.7-2 2.1-.6 2.9-2.8.6-2 2.1-2.6-1.1-2.6 1.1-2-2.1-2.8-.6-.6-2.9-2-2.1 1.1-2.7-.3-2.9 2.5-1.5 1.3-2.6 2.9.1Z"/><path d="m8 11 3 3 5-5M8 21l-1 2m9-2 1 2"/></>,
    layers: <><path d="m12 2 10 5-10 5L2 7l10-5Zm-10 10 10 5 10-5M2 17l10 5 10-5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18"/></>,
    shield: <><path d="m12 2 9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6l9-4Z"/><path d="m8 12 3 3 5-6"/></>,
    rocket: <><path d="M4 16c2-7 7-12 17-13-1 10-6 15-13 17l-4-4Zm6-6 4 4M4 16l-2 5 5-2M7 21l-1 2m8-15h.01"/></>
  };
  return <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
