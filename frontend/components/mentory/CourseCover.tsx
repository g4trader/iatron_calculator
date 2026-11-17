import Image from 'next/image';
/** Original abstract artwork supplied in the approved handoff, never clinical imagery. */
export default function CourseCover({ index = 0, compact = false, moduleId, version = 0 }: { index?: number; compact?: boolean; moduleId?: string; version?: number }) {
  const covers = ['fundamentos', 'emergencias', 'terapia-intensiva', 'neonatologia', 'capa-generica'];
  return <Image className={`course-cover ${compact ? 'cover-compact' : ''}`} src={moduleId ? '/api/mentory/modules/'+encodeURIComponent(moduleId)+'/cover?index='+index+'&v='+version : `/mentory/covers/${covers[index % covers.length]}.svg`} alt="" width={640} height={360} unoptimized/>;
}
