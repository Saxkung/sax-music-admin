import { requireAdmin } from '@/lib/requireAdmin';
import { redirect } from 'next/navigation';
export default async function Page() { await requireAdmin(); redirect('/projects'); }
