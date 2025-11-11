/* sax-music-admin/src/components/ui/ImageUploader.tsx (อัปเดต) */
'use client';

import * as React from 'react';
import { useState } from 'react';
import { useAdminUploader } from '@/hooks/useAdminUploader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadResult {
  url: string;
  key: string;
}

interface ImageUploaderProps {
  value: string; // URL รูปภาพปัจจุบัน
  // ⭐️ 1. แก้ไข Type ของ onUploadSuccess
  onUploadSuccess: (result: UploadResult | null) => void;
  className?: string;
}

export function ImageUploader({
  value,
  onUploadSuccess,
  className,
}: ImageUploaderProps) {
  const { uploadFile, isLoading, progress, error } = useAdminUploader('direct');
  // ⭐️ 2. ใช้ value สำหรับ preview เริ่มต้น
  const [preview, setPreview] = useState<string | null>(value);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. สร้าง Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 2. เริ่มอัปโหลด
    const result = await uploadFile(file);
    if (result) {
      // ⭐️ 3. คืนค่าทั้ง Object (url และ key)
      onUploadSuccess(result);
      setPreview(result.url); // อัปเดต Preview เป็น URL จริง
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="border rounded-md p-4 space-y-3">
        {preview && (
          <div className="relative group w-48 h-48 mx-auto border rounded">
            <img
              src={preview}
              alt="Image Preview"
              className="w-full h-full object-contain"
            />
            <Button
              variant="destructive"
              size="icon-sm"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                setPreview(null);
                // ⭐️ 4. คืนค่า null เมื่อลบ
                onUploadSuccess(null); 
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        <Input
          type="file"
          accept="image/png, image/jpeg, image/avif, image/webp"
          onChange={handleFileChange}
          disabled={isLoading}
          className="file:text-primary file:font-semibold"
        />
      </div>

      {isLoading && (
        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
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