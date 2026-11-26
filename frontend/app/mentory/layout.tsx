import './mentory.css';
import './mentory-ux-v2.css';
import './design-final.css';
import './handoff.css';
import './community.css';
import './ped-brand.css';
import { pedFonts } from './ped-fonts';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Ped Expert Mentory', description: 'Sua jornada de educação médica.', robots: { index: false, follow: false }, icons: { icon: '/images/ped-wordmark-icon.svg', shortcut: '/images/ped-wordmark-icon.svg', apple: '/images/ped-wordmark-icon.svg' } };
export default function Layout({ children }: { children: React.ReactNode }) { return <div className={`mentory ${pedFonts}`}>{children}</div>; }
