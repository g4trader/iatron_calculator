import { Barlow, Montserrat } from 'next/font/google';
export const barlow=Barlow({subsets:['latin'],weight:['500','700'],variable:'--font-ped-barlow',display:'swap'});
export const montserrat=Montserrat({subsets:['latin'],weight:['400','500','600','700'],variable:'--font-ped-montserrat',display:'swap'});
export const pedFonts=barlow.variable+' '+montserrat.variable;
