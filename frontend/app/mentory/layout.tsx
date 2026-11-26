import { Barlow, Montserrat } from 'next/font/google';
import './mentory.css';
import './mentory-ux-v2.css';
import './design-final.css';
import './handoff.css';
import './community.css';
import './brand-system-v1.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Ped Expert Mentory', description: 'Sua jornada de educação médica.', robots: { index: false, follow: false }, icons: { icon: '/images/mentory-favicon.png', shortcut: '/images/mentory-favicon.png', apple: '/images/mentory-favicon.png' } };
const barlow=Barlow({subsets:['latin'],weight:['500','600','700'],variable:'--mentory-heading',display:'swap'});
const montserrat=Montserrat({subsets:['latin'],weight:['400','500','600','700'],variable:'--mentory-body',display:'swap'});
export default function Layout({ children }: { children: React.ReactNode }) { return <div className={`mentory ${barlow.variable} ${montserrat.variable}`}>{children}</div>; }
