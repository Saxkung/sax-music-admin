/* sax-music-admin/src/hooks/useAdminUploader.ts (อัปเดต) */
import { useState } from 'react';
import { adminFetch } from '@/lib/adminFetcher';

type UploadMode = 'direct' | 'presigned';
const MAX_DIRECT_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadResult {
  url: string;
  key: string;
}

export function useAdminUploader(mode: UploadMode = 'direct') {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File): Promise<UploadResult | null> => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    // ⭐️ 1. Direct Upload (mode='direct') จะไม่ skipProxy แล้ว
    const useDirect = mode === 'direct' && file.size < MAX_DIRECT_UPLOAD_SIZE;

    try {
      if (useDirect) {
        // --- Direct Upload (< 5MB) ---
        console.log('🚀 [Uploader] Using DIRECT upload (via proxy)');
        
        const formData = new FormData();
        formData.append('file', file);

        // ⭐️ 2. ส่งผ่าน Proxy (Cookie จะถูกส่งไปด้วย)
        const result = await adminFetch<UploadResult>('/upload/direct', {
          method: 'POST',
          body: formData,
          // ⭐️ 3. ลบ skipProxy: true ออก
          // skipProxy: true, // ❌ ลบออก
        });
        
        setProgress(100);
        return result;

      } else {
        // --- Presigned Upload (> 5MB) ---
        console.log('🚀 [Uploader] Using PRESIGNED upload');
        
        // ⭐️ 4. (ถูกต้องแล้ว) ขอ presigned URL (ผ่าน proxy)
        const presignResponse = await adminFetch<{
          uploadUrl: string;
          key: string;
          publicUrl: string;
        }>('/upload/presign', {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
          skipProxy: false, // ผ่าน proxy (ถูกต้อง)
        });

        // ⭐️ 5. อัปโหลดตรง (ถูกต้องแล้ว)
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', presignResponse.uploadUrl, true);
          xhr.setRequestHeader('Content-Type', file.type);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              setProgress(percentComplete);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setProgress(100);
              resolve({
                url: presignResponse.publicUrl,
                key: presignResponse.key,
              });
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => {
            reject(new Error('Upload failed (Network error)'));
          };

          xhr.send(file);
        });
      }
    } catch (e: any) {
      console.error('❌ [Uploader] Upload error:', e);
      setError(e.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { uploadFile, isLoading, progress, error };
}