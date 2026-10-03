export interface Category { id: string; name: string; display_order: number; is_visible: number; }
export interface Project { id: string; title: string; description: string; image: string; category_id: string; categoryName: string; display_order: number; is_published: number; trackCount: number; }
export interface Track { id: number; title: string; artist: string; src: string; project_id: string; display_order: number; duration: number; }
export interface UploadResult { url: string; key: string; }
export const newId = () => crypto.randomUUID().replaceAll('-', '');
export const message = (error: unknown) => error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง';
export const audioTitle = (name: string) => name.replace(/\.[^.]+$/, '').replaceAll('_', ' ').trim();
