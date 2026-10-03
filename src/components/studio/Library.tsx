'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, ArrowUpRight, Disc3, Eye, Pencil, RefreshCw } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetcher';
import { message, newId, type Project, type Category } from '@/lib/studio';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Dialog, Loading, Notice, OrderButtons } from './Primitives';
export default function Library() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]); const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true); const [notice, setNotice] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [search, setSearch] = useState(''); const [category, setCategory] = useState('all'); const [status, setStatus] = useState('all');
  const [creating, setCreating] = useState(false); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [newCategory, setNewCategory] = useState('');
  const [image, setImage] = useState(''); const [tempImageKey, setTempImageKey] = useState<string>();
  const load = useCallback(async (signal?: AbortSignal) => {
    try { const [p, c] = await Promise.all([adminFetch<Project[]>('/projects', { signal }), adminFetch<Category[]>('/categories', { signal })]); setProjects(p); setCategories(c); setError(''); }
    catch (cause) { if (!signal?.aborted) setError(message(cause)); } finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const filtered = projects.filter(project => (category === 'all' || project.category_id === category) &&
    (status === 'all' || Boolean(project.is_published) === (status === 'published')) && (project.title + ' ' + project.categoryName).toLowerCase().includes(search.toLowerCase()));
  async function move(project: Project, direction: number) {
    const list = projects.filter(item => item.category_id === project.category_id); const index = list.findIndex(item => item.id === project.id); const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    setBusy(true); setError('');
    try { await adminFetch('/projects/reorder', { method: 'PATCH', body: JSON.stringify({ items: list.map((item, order) => ({ id: item.id, display_order: order })) }) }); await load(); setNotice('บันทึกลำดับผลงานแล้ว'); }
    catch (cause) { setError(message(cause)); } finally { setBusy(false); }
  }
  function openCreate() { setTitle(''); setDescription(''); setImage(''); setTempImageKey(undefined); setNewCategory(category === 'all' ? categories[0]?.id || '' : category); setError(''); setCreating(true); }
  function closeCreate() { if (busy || coverUploading) return; if ((title || image) && !window.confirm('ปิดโดยไม่บันทึกโปรเจกต์นี้?')) return; setCreating(false); }
  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const id = newId(); const order = Math.max(-1, ...projects.filter(p => p.category_id === newCategory).map(p => p.display_order)) + 1;
      await adminFetch('/projects', { method: 'POST', body: JSON.stringify({ id, title, description, category_id: newCategory, image, tempImageKey, display_order: order, is_published: false }) });
      router.push('/projects/' + id);
    } catch (cause) { setError(message(cause)); setBusy(false); }
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">PORTFOLIO LIBRARY</p><h1>คลังผลงาน<span className="title-dot">.</span></h1><p className="muted">จัดการรูปปก เพลง และการเผยแพร่ในที่เดียว</p></div><button className="btn btn-primary" onClick={openCreate} disabled={!categories.length || busy}><Plus size={19} />เพิ่มโปรเจกต์</button></div>
    <div className="stats-row"><div><span>ผลงานทั้งหมด</span><strong>{projects.length.toString().padStart(2, '0')}</strong><Disc3 size={22} /></div><div><span>เผยแพร่บนเว็บ</span><strong>{projects.filter(p => p.is_published).length.toString().padStart(2, '0')}</strong><Eye size={22} /></div><div><span>เพลงทั้งหมด</span><strong>{projects.reduce((sum, p) => sum + p.trackCount, 0).toString().padStart(2, '0')}</strong><span className="stat-caption">TRACKS</span></div></div>
    <Notice error>{error && !creating ? error : ''}</Notice><Notice>{notice}</Notice>
    <div className="library-toolbar"><label className="search-box"><Search size={18} /><input aria-label="ค้นหาผลงาน" placeholder="ค้นหาชื่อผลงาน…" value={search} onChange={event => setSearch(event.target.value)} /></label><select className="field" aria-label="กรองหมวดหมู่" value={category} onChange={event => setCategory(event.target.value)}><option value="all">ทุกหมวดหมู่</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select className="field" aria-label="กรองสถานะ" value={status} onChange={event => setStatus(event.target.value)}><option value="all">ทุกสถานะ</option><option value="published">เผยแพร่แล้ว</option><option value="draft">Draft</option></select><button className="icon-button" onClick={() => void load()} aria-label="รีเฟรชผลงาน" title="รีเฟรชผลงาน" disabled={busy}><RefreshCw size={18} /></button></div>
    <div className="section-label"><span>{filtered.length} โปรเจกต์</span><span>{category !== 'all' && !search && status === 'all' ? 'ลูกศรเปลี่ยนลำดับและบันทึกทันที' : 'เปิดโปรเจกต์เพื่อจัดการเพลง'}</span></div>
    {loading ? <Loading /> : <div className="project-grid">{filtered.map(project => {
      const siblings = projects.filter(p => p.category_id === project.category_id); const index = siblings.findIndex(p => p.id === project.id);
      return <article className="project-tile" key={project.id}><Link href={'/projects/' + project.id} className="project-tile-link"><div className="tile-artwork">{project.image ? <img src={project.image} alt="" width={100} height={140} loading="lazy" /> : <Disc3 size={30} />}</div><div className="tile-info"><span className="category-caption">{project.categoryName}</span><h2>{project.title}</h2><p>{project.trackCount} เพลง</p><span className={project.is_published ? 'badge badge-live' : 'badge'}>{project.is_published ? 'เผยแพร่แล้ว' : 'Draft'}</span><span className="tile-action"><Pencil size={14} />จัดการโปรเจกต์ <ArrowUpRight size={16} /></span></div></Link>{category !== 'all' && !search && status === 'all' && <OrderButtons name={project.title} first={index === 0} last={index === siblings.length - 1} disabled={busy} move={direction => void move(project, direction)} />}</article>;
    })}</div>}
    {!loading && !filtered.length && <div className="empty-state"><Disc3 size={35} /><h2>{projects.length ? 'ไม่พบผลงานที่ค้นหา' : 'เริ่มจากโปรเจกต์แรกของคุณ'}</h2><p>เพิ่มโปรเจกต์ ใส่รูปปกและเพลง แล้วเผยแพร่เมื่อพร้อม</p>{!categories.length ? <Link className="btn btn-primary" href="/categories">เพิ่มหมวดหมู่ก่อน</Link> : <button className="btn" onClick={openCreate}><Plus size={18} />เพิ่มโปรเจกต์</button>}</div>}
    <Dialog open={creating} title="เพิ่มโปรเจกต์" onClose={closeCreate} busy={busy || coverUploading}><form onSubmit={create} className="dialog-form"><p className="muted">เริ่มเป็น Draft แล้วเพิ่มเพลงต่อในหน้าโปรเจกต์</p><div className="create-layout"><div className="form-stack"><label className="field-label">ชื่อผลงาน<input autoFocus className="field" required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} disabled={busy} placeholder="ชื่อภาพยนตร์ ซีรีส์ หรือเพลง" /></label><label className="field-label">หมวดหมู่<select className="field" required value={newCategory} onChange={event => setNewCategory(event.target.value)} disabled={busy}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="field-label">บทบาท / คำอธิบาย<textarea className="field" rows={3} maxLength={2000} value={description} onChange={event => setDescription(event.target.value)} disabled={busy} placeholder="เช่น Music Composer & Arranger" /></label></div><ImageUploader onBusyChange={setCoverUploading} value={image} onChange={(url, key) => { setImage(url); setTempImageKey(key); }} disabled={busy} /></div><Notice error>{error}</Notice><div className="form-actions"><button type="button" className="btn" onClick={closeCreate} disabled={busy}>ยกเลิก</button><button className="btn btn-primary" type="submit" disabled={busy || coverUploading || !title.trim() || !newCategory}>{busy ? 'กำลังสร้าง…' : 'สร้างและเพิ่มเพลงต่อ'}<ArrowUpRight size={16} /></button></div></form></Dialog>
  </>;
}
