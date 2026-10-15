import Shell from '@/components/mentory/Shell';
import CourseDemo from '@/components/mentory/CourseDemo';
import { pageIdentity } from '@/lib/mentory/server';
export const dynamic = 'force-dynamic';
export default async function CourseDemonstration() {
  const actor = await pageIdentity(true);
  return <Shell editor={actor.editor} name={actor.name}><CourseDemo/></Shell>;
}
