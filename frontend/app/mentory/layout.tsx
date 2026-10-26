import './mentory.css';
import './mentory-ux-v2.css';
import './design-final.css';
import './handoff.css';
import './community.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'MENTOR.iatron', description: 'Sua jornada de educação médica.', robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return <div className="mentory">{children}</div>; }
