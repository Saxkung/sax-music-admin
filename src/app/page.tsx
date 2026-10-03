import { requireAdmin } from '@/lib/requireAdmin';
import Library from '@/components/studio/Library';
export default async function Page() { await requireAdmin(); return <Library />; }
