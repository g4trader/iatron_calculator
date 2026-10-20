import Image from 'next/image';
/** Original abstract artwork supplied in the approved handoff, never clinical imagery. */
export default function CourseCover({ index = 0, compact = false }: { index?: number; compact?: boolean }) {
  const covers = ['fundamentos', 'emergencias', 'terapia-intensiva', 'neonatologia', 'capa-generica'];
  return <Image className={`course-cover ${compact ? 'cover-compact' : ''}`} src={`/mentory/covers/${covers[index % covers.length]}.svg`} alt="" width={640} height={360} unoptimized/>;
}
