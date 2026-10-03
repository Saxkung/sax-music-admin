import { requireAdmin } from '@/lib/requireAdmin';
import ProjectEditor from '@/components/studio/ProjectEditor';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { await requireAdmin(); const { id } = await params; return <ProjectEditor key={id} id={id} />; }
