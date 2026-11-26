export function PedBrand({variant='short'}:{variant?:'short'|'full'|'signature'|'print'|'mono'}) {
 return <span className={'ped-brand ped-brand-'+variant} role="img" aria-label="Ped Expert Mentory"><strong>PED EXPERT</strong><span>MENTORY</span>{variant!=='short'&&<small>Dr. Aristóteles Pires</small>}</span>;
}
