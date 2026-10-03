'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FolderUp, Plus, Play, Pencil, Save, Eye, EyeOff, Check, Circle, Trash2, Disc3 } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetcher';
import { audioTitle, message, type Project, type Category, type Track } from '@/lib/studio';
import { useAdminUploader } from '@/hooks/useAdminUploader';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Dialog, Loading, Notice, OrderButtons } from './Primitives';
type Draft = { title: string; description: string; category_id: string; image: string; tempImageKey?: string };
const toDraft = (project: Project): Draft => ({ title: project.title, description: project.description || '', category_id: project.category_id, image: project.image || '' });
function AudioPreview({ source }: { source: string }) {
  const audio = useRef<HTMLAudioElement>(null); const [error, setError] = useState('');
  useEffect(() => {
    const element = audio.current!; let disposed = false; let destroy: (() => void) | undefined;
    const start = async () => {
      if (/\.m3u8(?:\?|$)/i.test(source) && !element.canPlayType('application/vnd.apple.mpegurl')) {
        const { default: Hls } = await import('hls.js');
        if (disposed) return;
        if (!Hls.isSupported()) { setError('เบราว์เซอร์นี้ไม่รองรับ HLS'); return; }
        const hls = new Hls(); hls.loadSource(source); hls.attachMedia(element); destroy = () => hls.destroy();
        hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) setError('โหลดเพลงไม่ได้ ตรวจสอบ URL และไฟล์ HLS ที่เกี่ยวข้อง'); });
      } else element.src = source;
    };
    void start().catch(() => { if (!disposed) setError('โหลดเพลงไม่ได้ กรุณาลองอีกครั้ง'); });
    return () => { disposed = true; destroy?.(); element.pause(); element.removeAttribute('src'); element.load(); };
  }, [source]);
  return <div><audio ref={audio} controls preload="metadata" className="audio-preview" onError={() => setError('โหลดเพลงไม่ได้ ตรวจสอบไฟล์หรือ URL')} aria-label="ทดลองฟังเพลง" />{error && <p className="field-error" role="alert">{error}</p>}</div>;
}
export default function ProjectEditor({ id }: { id: string }) {
  const router = useRouter(); const uploader = useAdminUploader();
  const [project, setProject] = useState<Project | null>(null); const [categories, setCategories] = useState<Category[]>([]); const [tracks, setTracks] = useState<Track[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null); const [baseline, setBaseline] = useState(''); const [loading, setLoading] = useState(true);
  const [coverUploading, setCoverUploading] = useState(false);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const [error, setError] = useState(''); const [preview, setPreview] = useState<number | null>(null);
  const [trackForm, setTrackForm] = useState<{ id?: number; title: string; artist: string; src: string } | null>(null);
  const [importing, setImporting] = useState(''); const cancelImport = useRef(false); const fileInput = useRef<HTMLInputElement>(null); const folderInput = useRef<HTMLInputElement>(null);
  const dirty = draft !== null && JSON.stringify(draft) !== baseline;
  useEffect(() => { const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); if (dirty && !busy && !coverUploading) (document.getElementById('project-form') as HTMLFormElement | null)?.requestSubmit(); } }; window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut); }, [dirty, busy, coverUploading]);
  useEffect(() => { folderInput.current?.setAttribute('webkitdirectory', ''); }, [loading]);
  const loadTracks = useCallback(async () => { const list = await adminFetch<Track[]>('/tracks/' + id); setTracks(list); setProject(previous => previous ? { ...previous, trackCount: list.length } : null); }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([adminFetch<Project[]>('/projects', { signal: controller.signal }), adminFetch<Category[]>('/categories', { signal: controller.signal }), adminFetch<Track[]>('/tracks/' + id, { signal: controller.signal })])
      .then(([projects, groups, list]) => { if (controller.signal.aborted) return; const selected = projects.find(item => item.id === id); if (!selected) throw new Error('ไม่พบโปรเจกต์นี้'); setProject(selected); setCategories(groups); setTracks(list); const initial = toDraft(selected); setDraft(initial); setBaseline(JSON.stringify(initial)); })
      .catch(cause => { if (!controller.signal.aborted) setError(message(cause)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);
  useEffect(() => {
    if (!dirty) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const protectNavigation = (event: MouseEvent) => { const link = (event.target as Element).closest('a'); if (link && link.target !== '_blank' && !window.confirm('มีการแก้ไขที่ยังไม่ได้บันทึก ออกจากหน้านี้?')) { event.preventDefault(); event.stopPropagation(); } };
    window.addEventListener('beforeunload', protect); document.addEventListener('click', protectNavigation, true);
    return () => { window.removeEventListener('beforeunload', protect); document.removeEventListener('click', protectNavigation, true); };
  }, [dirty]);
  async function save(event?: React.FormEvent) {
    event?.preventDefault(); if (!draft) return; setBusy(true); setError('');
    try { await adminFetch('/projects/' + id, { method: 'PUT', body: JSON.stringify(draft) }); const fresh = (await adminFetch<Project[]>('/projects')).find(item => item.id === id)!; const saved = toDraft(fresh); setProject(fresh); setDraft(saved); setBaseline(JSON.stringify(saved)); setNotice('บันทึกข้อมูลและรูปปกแล้ว'); }
    catch (cause) { setError(message(cause)); } finally { setBusy(false); }
  }
  async function togglePublish() {
    if (!project || dirty || coverUploading) return; setBusy(true); setError('');
    try { await adminFetch('/projects/' + id, { method: 'PUT', body: JSON.stringify({ is_published: !project.is_published }) }); setProject({ ...project, is_published: project.is_published ? 0 : 1 }); setNotice(project.is_published ? 'ย้ายเป็น Draft แล้ว' : 'เผยแพร่แล้ว หน้าเว็บอาจใช้เวลาสูงสุด 1 นาทีเพื่ออัปเดต'); }
    catch (cause) { setError(message(cause)); } finally { setBusy(false); }
  }
  async function deleteProject() {
    if (!window.confirm(`ลบ “${project?.title}” และเพลง ${tracks.length} รายการ? การลบย้อนกลับไม่ได้`)) return;
    setBusy(true); try { await adminFetch('/projects/' + id, { method: 'DELETE' }); router.push('/projects'); } catch (cause) { setError(message(cause)); setBusy(false); }
  }
  async function saveTrack(event: React.FormEvent) {
    event.preventDefault(); if (!trackForm) return; setBusy(true); setError('');
    try { await adminFetch('/tracks' + (trackForm.id ? '/' + trackForm.id : ''), { method: trackForm.id ? 'PUT' : 'POST', body: JSON.stringify({ ...trackForm, project_id: id, ...(trackForm.id ? {} : { display_order: Math.max(-1, ...tracks.map(track => track.display_order)) + 1 }) }) }); await loadTracks(); setTrackForm(null); setNotice('บันทึกเพลงแล้ว'); }
    catch (cause) { setError(message(cause)); } finally { setBusy(false); }
  }
  async function deleteTrack(track: Track) {
    if (!window.confirm(`ลบเพลง “${track.title}” ออกจากโปรเจกต์นี้?`)) return;
    setBusy(true); setError('');
    try { await adminFetch('/tracks/' + track.id, { method: 'DELETE' }); await loadTracks(); setPreview(null); setNotice('ลบรายการเพลงแล้ว'); } catch (cause) { setError(message(cause)); } finally { setBusy(false); }
  }
  async function moveTrack(index: number, direction: number) {
    const list = [...tracks]; [list[index], list[index + direction]] = [list[index + direction], list[index]]; setBusy(true); setError('');
    try { await adminFetch('/tracks/reorder', { method: 'PATCH', body: JSON.stringify({ items: list.map((track, order) => ({ id: track.id, display_order: order })) }) }); await loadTracks(); setNotice('บันทึกลำดับเพลงแล้ว'); } catch (cause) { setError(message(cause)); } finally { setBusy(false); }
  }
  async function importFiles(files: File[], hls = false) {
    if (!files.length) return; cancelImport.current = false; setBusy(true); setError(''); setNotice(''); let added = 0;
    let order = Math.max(-1, ...tracks.map(track => track.display_order)) + 1;
    const add = async (title: string, src: string) => { await adminFetch('/tracks', { method: 'POST', body: JSON.stringify({ title, artist: '', src, project_id: id, display_order: order++ }) }); added++; };
    try {
      if (hls) {
        const manifests = files.filter(file => /\.m3u8$/i.test(file.name));
        if (!manifests.length) throw new Error('โฟลเดอร์ HLS ต้องมีไฟล์ .m3u8');
        const allowed = files.filter(file => /\.(m3u8|ts|m4a|aac|mp4|m4s|json)$/i.test(file.name));
        if (allowed.some(file => file.size > 50 * 1024 * 1024)) throw new Error('แต่ละไฟล์ต้องไม่เกิน 50 MB');
        let entry = [...manifests].sort((a, b) => a.webkitRelativePath.length - b.webkitRelativePath.length)[0];
        for (const manifest of manifests) { if ((await manifest.text()).includes('#EXT-X-STREAM-INF')) { entry = manifest; break; } }
        const bundle = crypto.randomUUID(); let entryUrl = '';
        for (const [index, file] of allowed.entries()) { if (cancelImport.current) throw new Error('ยกเลิกการนำเข้าแล้ว'); setImporting(`${index + 1}/${allowed.length} · ${file.name}`); const result = await uploader.uploadFile(file, { bundle, relativePath: file.webkitRelativePath || file.name }); if (file === entry) entryUrl = result.url; }
        await add(audioTitle(files[0].webkitRelativePath.split('/')[0] || entry.name), entryUrl);
      } else {
        if (files.some(file => !/\.(mp3|wav|m4a|aac|flac|ogg|opus)$/i.test(file.name) || file.size > 50 * 1024 * 1024)) throw new Error('ใช้ไฟล์เสียง MP3, WAV, M4A, AAC, FLAC, OGG หรือ OPUS ขนาดไม่เกิน 50 MB');
        for (const [index, file] of files.entries()) { if (cancelImport.current) throw new Error('ยกเลิกการนำเข้าแล้ว'); setImporting(`${index + 1}/${files.length} · ${file.name}`); const result = await uploader.uploadFile(file); await add(audioTitle(file.name), result.url); }
      }
      setNotice(`เพิ่มเพลง ${added} รายการแล้ว กดแก้ไขเพื่อเปลี่ยนชื่อหรือศิลปิน`);
    } catch (cause) { setError(`${message(cause)}${added ? ` · เพิ่มสำเร็จแล้ว ${added} รายการ` : ''}`); }
    finally { await loadTracks().catch(cause => setError(message(cause))); setImporting(''); setBusy(false); if (fileInput.current) fileInput.current.value = ''; if (folderInput.current) folderInput.current.value = ''; }
  }
  if (loading) return <Loading />;
  if (!project || !draft) return <><Notice error>{error}</Notice><Link className="btn" href="/projects">กลับไปคลังผลงาน</Link></>;
  const ready = Boolean(draft.image && tracks.length);
  return <><Link href="/projects" className="back-link"><ArrowLeft size={16} />คลังผลงาน</Link><div className="editor-heading"><div><p className="eyebrow">PROJECT WORKSPACE</p><h1>{project.title}</h1></div><div className="heading-actions"><span className={project.is_published ? 'badge badge-live' : 'badge'}>{project.is_published ? 'เผยแพร่แล้ว' : 'Draft'}</span><button className="btn btn-primary" onClick={() => void togglePublish()} disabled={busy || coverUploading || dirty || (!project.is_published && !ready)} title={dirty ? 'บันทึกการแก้ไขก่อนเผยแพร่' : !ready ? 'เพิ่มรูปปกและเพลงก่อนเผยแพร่' : undefined}>{project.is_published ? <EyeOff size={17} /> : <Eye size={17} />}{project.is_published ? 'ย้ายเป็น Draft' : 'เผยแพร่บนเว็บ'}</button></div></div>
    <Notice error>{error && !trackForm ? error : ''}</Notice><Notice>{notice}</Notice><div className="project-workspace"><div><form id="project-form" onSubmit={save} className="panel"><div className="panel-heading"><h2>รายละเอียดผลงาน</h2><p>ชื่อและคำอธิบายที่ผู้ฟังจะเห็นบนการ์ด</p></div><div className="metadata-grid"><label className="field-label">ชื่อผลงาน<input className="field" required maxLength={200} value={draft.title} disabled={busy} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label><label className="field-label">หมวดหมู่<select className="field" value={draft.category_id} disabled={busy} onChange={event => setDraft({ ...draft, category_id: event.target.value })}>{categories.map(c => <option value={c.id} key={c.id}>{c.name}{c.is_visible ? '' : ' (ซ่อน)'}</option>)}</select></label><label className="field-label">บทบาท / คำอธิบาย<textarea className="field" rows={2} maxLength={2000} value={draft.description} disabled={busy} onChange={event => setDraft({ ...draft, description: event.target.value })} /></label></div></form>
      <section className="panel"><div className="panel-heading"><h2>รายการเพลง <span className="muted">/ {tracks.length.toString().padStart(2, '0')}</span></h2><p>อัปโหลดเพื่อเพิ่มรายการอัตโนมัติ · ลูกศรเปลี่ยนลำดับและบันทึกทันที</p></div><div className="track-toolbar"><button className="btn btn-primary" disabled={busy} onClick={() => fileInput.current?.click()}><Upload size={16} />เพิ่มไฟล์เสียง</button><button className="btn" disabled={busy} onClick={() => folderInput.current?.click()}><FolderUp size={16} />นำเข้าโฟลเดอร์ HLS</button><button className="btn" disabled={busy} onClick={() => { setError(''); setTrackForm({ title: '', artist: '', src: '' }); }}><Plus size={16} />เพิ่มด้วย URL</button></div>
      <input hidden type="file" multiple ref={fileInput} accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,.opus" onChange={event => void importFiles(Array.from(event.target.files || []))} /><input hidden type="file" multiple ref={folderInput} onChange={event => void importFiles(Array.from(event.target.files || []), true)} />
      {importing && <div className="upload-status" role="status"><span>กำลังนำเข้า {importing}</span><progress value={uploader.progress} max={100} aria-label="ความคืบหน้าการอัปโหลด" /><button className="btn" onClick={() => { cancelImport.current = true; uploader.cancel(); }}>ยกเลิกการนำเข้า</button></div>}
      {!tracks.length && <div className="empty-state"><Disc3 size={30} /><p>เลือกหลายไฟล์ได้พร้อมกัน ชื่อเพลงจะตั้งจากชื่อไฟล์</p><small>ไฟล์เสียงสูงสุด 50 MB ต่อไฟล์<br />HLS: เลือกโฟลเดอร์ที่มี .m3u8 และไฟล์เสียงประกอบ</small></div>}
      {tracks.map((track, index) => <div key={track.id}><div className="track-row"><span className="track-number">{(index + 1).toString().padStart(2, '0')}</span><div className="track-info"><strong>{track.title}</strong><small>{track.artist || 'ยังไม่ระบุศิลปิน'} · {/\.m3u8(?:\?|$)/i.test(track.src) ? 'HLS' : 'Audio'}</small></div><div className="track-actions"><button className="btn" onClick={() => setPreview(preview === track.id ? null : track.id)} aria-expanded={preview === track.id}><Play size={14} />{preview === track.id ? 'ปิด' : 'ฟัง'}</button><button className="btn" disabled={busy} onClick={() => { setError(''); setTrackForm({ id: track.id, title: track.title, artist: track.artist, src: track.src }); }}><Pencil size={14} />แก้ไข</button><OrderButtons name={track.title} first={index === 0} last={index === tracks.length - 1} disabled={busy} move={direction => void moveTrack(index, direction)} /></div></div>{preview === track.id && <AudioPreview key={track.src} source={track.src} />}</div>)}
      </section><div className={dirty ? "save-bar" : "save-bar is-clean"}><p>{dirty ? 'มีการแก้ไขที่ยังไม่ได้บันทึก' : 'ข้อมูลล่าสุดบันทึกแล้ว'}<small>การเพิ่มเพลงและเปลี่ยนลำดับจะบันทึกทันที</small></p><button className="btn btn-primary" form="project-form" type="submit" disabled={busy || coverUploading || !dirty || !draft.title.trim()}><Save size={16} />{busy ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}</button></div><details className="danger-zone"><summary>การจัดการโปรเจกต์เพิ่มเติม</summary><p>การลบโปรเจกต์จะลบรายการเพลงทั้งหมดออกจากคลัง</p><button className="btn btn-danger" disabled={busy} onClick={() => void deleteProject()}><Trash2 size={15} />ลบโปรเจกต์นี้</button></details>
    </div><aside className="panel cover-panel"><div className="panel-heading"><h3>รูปปกและตัวอย่าง</h3><p>กดรูปเพื่อเปลี่ยน หรือวางไฟล์ลงบนรูป</p></div><ImageUploader onBusyChange={setCoverUploading} value={draft.image} disabled={busy} onChange={(url, key) => setDraft({ ...draft, image: url, tempImageKey: key })} /><div className="preview-title"><h3>{draft.title}</h3><p>{draft.description}</p></div><div className="readiness"><span className={draft.image ? 'ready' : ''}>{draft.image ? <Check size={15} /> : <Circle size={13} />}รูปปก</span><span className={tracks.length ? 'ready' : ''}>{tracks.length ? <Check size={15} /> : <Circle size={13} />}เพลงพร้อมฟัง {tracks.length} รายการ</span><span className={categories.find(c => c.id === draft.category_id)?.is_visible ? 'ready' : ''}>{categories.find(c => c.id === draft.category_id)?.is_visible ? <Check size={15} /> : <Circle size={13} />}หมวดหมู่แสดงบนเว็บ</span></div></aside></div>
    <Dialog open={Boolean(trackForm)} title={trackForm?.id ? 'แก้ไขเพลง' : 'เพิ่มเพลงด้วย URL'} onClose={() => { if (!busy) setTrackForm(null); }} busy={busy}>{trackForm && <form onSubmit={saveTrack} className="dialog-form"><div className="form-stack"><label className="field-label">ชื่อเพลง<input autoFocus className="field" required maxLength={200} value={trackForm.title} onChange={event => setTrackForm({ ...trackForm, title: event.target.value })} disabled={busy} /></label><label className="field-label">ศิลปิน / ผู้ประพันธ์<input className="field" maxLength={200} value={trackForm.artist} onChange={event => setTrackForm({ ...trackForm, artist: event.target.value })} disabled={busy} /></label><label className="field-label">URL ไฟล์เสียงหรือ HLS<input className="field" type="url" required value={trackForm.src} onChange={event => setTrackForm({ ...trackForm, src: event.target.value })} disabled={busy} placeholder="https://hls.saxmusic.site/…" /></label></div><Notice error>{error}</Notice><div className="form-actions">{trackForm.id && <button type="button" className="btn btn-danger" disabled={busy} onClick={async () => { const track = tracks.find(t => t.id === trackForm.id); if (track) { await deleteTrack(track); setTrackForm(null); } }}><Trash2 size={15} />ลบเพลง</button>}<button type="button" className="btn" disabled={busy} onClick={() => setTrackForm(null)}>ยกเลิก</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึกเพลง'}</button></div></form>}</Dialog>
  </>;
}
