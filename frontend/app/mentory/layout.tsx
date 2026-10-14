import './mentory.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'iatron.PED Mentory', description: 'Sua jornada de educação médica.', robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return <div className="mentory">{children}</div>; }
