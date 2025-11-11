// src/components/AdminLayout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { usePathname } from 'next/navigation';

const AUTH_COOKIE_NAME = 'sax-admin-token';

// Component นี้จะรันบน Server เพื่อตรวจสอบ Cookie ก่อน Render
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);

  // 1. ตรวจสอบ Token กับ ENV (เพื่อความปลอดภัยสูงสุด)
  const isLoggedIn = token?.value === process.env.ADMIN_TOKEN;

  // 2. ดึง Path ปัจจุบัน
  // (เราต้อง import 'next/navigation' สำหรับ usePathname แต่เราจะใช้ Server-side)
  // วิธีที่ง่ายกว่าคือเช็คว่า Token มีหรือไม่
  
  if (!isLoggedIn) {
    // 3. ถ้าไม่ Login และไม่ได้อยู่ที่หน้า Login ให้ Redirect
    // (เราจะจัดการเรื่องนี้ใน layout.tsx เพื่อหลีกเลี่ยงการใช้ usePathname ใน Server Component)
    redirect('/login');
  }

  // 4. ถ้า Login แล้ว
  return <>{children}</>;
}

// Client Component สำหรับจัดการ Redirect (ถ้าจำเป็น)
// แต่เราจะใช้ Middleware หรือการตรวจสอบใน Layout หลัก