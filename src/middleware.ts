// saxkung/sax-music-admin/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// ⭐️ import auth จากไฟล์ auth.ts
import { auth } from "@/auth"; 

// ⭐️ ใช้ Wrapper Function เพื่อบังคับ Redirect ที่ Cloudflare Pages รองรับ
// Note: เราเปลี่ยนชื่อ export จาก 'middleware' เป็น 'default' เพื่อให้ Edge Runtime จัดการได้ง่ายขึ้น
export default async function middleware(request: NextRequest) {
  
  // 1. เรียกใช้ Auth Handler
  const authResponse = await auth(request); 
  
  // 2. ถ้ามี Response จาก Auth Handler (หมายถึงมีการปฏิเสธหรือ Redirect ภายใน)
  if (authResponse) {
    
    // 3. ตรวจสอบ Header 'location' ที่บ่งบอกว่า Next-Auth พยายาม Redirect
    const isRedirectResponse = authResponse.headers.get('location'); 

    if (isRedirectResponse) {
      // 4. บังคับ Redirect ไปหน้า Login ด้วยตัวเองด้วยสถานะ 307
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      
      // ใช้ NextResponse.redirect พร้อม status 307 (แก้ไขปัญหา Cloudflare 404)
      return NextResponse.redirect(loginUrl, { status: 307 }); 
    }
    
    // 5. ถ้าไม่ใช่ Redirect (เช่น เป็น 401/403) ให้ส่ง Response เดิมกลับไป
    return authResponse;
  }

  // 6. ถ้า authResponse เป็น undefined (อนุญาตให้เข้าถึง) ให้ดำเนินการต่อไป
  return NextResponse.next();
}

// ⭐️ ต้องมี export const config เหมือนเดิม 
export const config = {
  matcher: [
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)',
  ],
};