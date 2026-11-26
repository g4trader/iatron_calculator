import '../mentory/mentory.css';
import '../mentory/handoff.css';
import '../mentory/ped-brand.css';
import { pedFonts } from '../mentory/ped-fonts';
export default function Layout({children}:{children:React.ReactNode}){return <div className={`mentory ${pedFonts}`}>{children}</div>}
