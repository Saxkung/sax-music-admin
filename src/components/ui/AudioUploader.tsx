/* sax-music-admin/src/components/ui/AudioUploader.tsx */
'use client';

import * as React from 'react';
import { useState } from 'react';
import { useAdminUploader } from '@/hooks/useAdminUploader';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Music, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioUploaderProps {
  value: string; // URL ไฟล์เสียงปัจจุบัน
  onUploadSuccess: (url: string) => void;
  className?: string;
}

export function AudioUploader({
  value,
  onUploadSuccess,
  className,
}: AudioUploaderProps) {
  // ❗️ บังคับใช้ 'presigned' สำหรับไฟล์เสียง/HLS ซึ่งมักจะใหญ่
  const { uploadFile, isLoading, progress, error } =
    useAdminUploader('presigned');
  const [currentFile, setCurrentFile] = useState<string | null>(value);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentFile(file.name); // แสดงชื่อไฟล์ที่กำลังอัปโหลด
    const result = await uploadFile(file);
    if (result) {
      onUploadSuccess(result.url);
      setCurrentFile(result.url); // อัปเดตเป็น URL จริง
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="border rounded-md p-4 space-y-3">
        <Input
          type="file"
          accept=".m3u8, .ts, .mp3, .wav, .m4a" // ⬅️ รองรับ HLS
          onChange={handleFileChange}
          disabled={isLoading}
          className="file:text-primary file:font-semibold"
        />
        {currentFile && !isLoading && !error && (
           <div className="text-green-600 text-sm flex items-center gap-2">
            <CheckCircle className="size-4" />
            <p className='truncate'>Ready: {currentFile}</p>
          </div>
        )}
      </div>

      {isLoading && (
        <div className='flex items-center gap-2'>
          <Loader2 className="size-4 animate-spin" />
          <div className="w-full bg-muted rounded-full h-2.5 flex-1">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
           <span className='text-sm font-medium'>{Math.round(progress)}%</span>
        </div>
      )}

      {error && (
        <div className="text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="size-4" />
          <p>Upload Failed: {error}</p>
        </div>
      )}
    </div>
  );
}