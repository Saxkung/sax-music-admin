'use client';
import { useEffect, useRef } from 'react';
import { ImagePlus, Upload, Loader2 } from 'lucide-react';
import { useAdminUploader } from '@/hooks/useAdminUploader';
import type { UploadResult } from '@/lib/studio';
export function ImageUploader({ value, onChange, disabled = false, onBusyChange }: { value: string; onChange: (url: string, key?: string) => void; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null); const uploader = useAdminUploader();
  useEffect(() => { onBusyChange?.(uploader.isLoading); }, [uploader.isLoading, onBusyChange]);
  async function upload(file?: File) {
    if (!file) return;
    if (!/\.(png|jpe?g|webp|avif)$/i.test(file.name) || file.size > 5 * 1024 * 1024) { window.alert('ใช้รูป JPG, PNG, WebP หรือ AVIF ขนาดไม่เกิน 5 MB'); return; }
    try { const result: UploadResult = await uploader.uploadFile(file); onChange(result.url, result.key); } catch { /* Inline uploader error below. */ }
    if (input.current) input.current.value = '';
  }
  return <div className="cover-uploader"><button type="button" className="cover-picker" disabled={disabled || uploader.isLoading} onClick={() => input.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!disabled && !uploader.isLoading) void upload(event.dataTransfer.files[0]); }} aria-label="อัปโหลดหรือเปลี่ยนรูปปก">
    {value ? <img src={value} alt="รูปปกโปรเจกต์" width={300} height={400} /> : <div><ImagePlus size={32} /><span>เพิ่มรูปปก</span><small>ลากรูปมาวาง หรือกดเพื่อเลือก</small></div>}
    <span className="cover-picker-action">{uploader.isLoading ? <><Loader2 size={16} className="spin" />{uploader.progress}%</> : <><Upload size={16} />{value ? 'เปลี่ยนรูปปก' : 'เลือกรูปปก'}</>}</span></button>
    <input type="file" hidden ref={input} accept=".jpg,.jpeg,.png,.webp,.avif" onChange={event => void upload(event.target.files?.[0])} />
    <small className="muted">JPG, PNG, WebP, AVIF · สูงสุด 5 MB</small>{uploader.error && <p className="field-error" role="alert">{uploader.error}</p>}
    <details className="advanced"><summary>ใช้ URL รูปแทน</summary><label className="field-label" htmlFor="cover-url">URL รูปปก</label><input id="cover-url" className="field" type="url" value={value} onChange={event => onChange(event.target.value)} disabled={disabled || uploader.isLoading} placeholder="https://hls.saxmusic.site/…" /></details>
  </div>;
}
