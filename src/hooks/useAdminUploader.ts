'use client';
import { useEffect, useRef, useState } from 'react';
import type { UploadResult } from '@/lib/studio';
export function useAdminUploader() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; xhrRef.current?.abort(); }; }, []);
  async function uploadFile(file: File, options?: { bundle: string; relativePath: string }): Promise<UploadResult> {
    if (file.size > 50 * 1024 * 1024) throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 50 MB');
    setIsLoading(true); setProgress(0); setError('');
    try {
      return await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest(); xhrRef.current = xhr;
        xhr.open('POST', '/api/admin-proxy/upload/direct');
        xhr.timeout = 180000;
        xhr.upload.onprogress = event => { if (mounted.current && event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
        xhr.onload = () => {
          if (xhr.status === 401) { window.location.assign('/login'); reject(new Error('กรุณาเข้าสู่ระบบใหม่')); return; }
          let data: UploadResult & { error?: string };
          try { data = JSON.parse(xhr.responseText); } catch { reject(new Error('อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง')); return; }
          if (xhr.status >= 200 && xhr.status < 300 && data.url && data.key) resolve(data);
          else reject(new Error(data.error || 'อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง'));
        };
        xhr.onerror = () => reject(new Error('การเชื่อมต่อขัดข้อง กรุณาลองอีกครั้ง'));
        xhr.ontimeout = () => reject(new Error('อัปโหลดนานเกินไป กรุณาลองอีกครั้ง'));
        xhr.onabort = () => reject(new Error('ยกเลิกการอัปโหลดแล้ว'));
        const form = new FormData(); form.append('file', file);
        if (options) { form.append('bundle', options.bundle); form.append('relativePath', options.relativePath); }
        xhr.send(form);
      });
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'อัปโหลดไม่สำเร็จ');
      throw cause;
    } finally { xhrRef.current = null; if (mounted.current) setIsLoading(false); }
  }
  return { uploadFile, isLoading, progress, error, cancel: () => xhrRef.current?.abort() };
}
