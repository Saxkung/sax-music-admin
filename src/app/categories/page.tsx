import { requireAdmin } from '@/lib/requireAdmin';
import Categories from '@/components/studio/Categories';
export default async function Page() { await requireAdmin(); return <Categories />; }
