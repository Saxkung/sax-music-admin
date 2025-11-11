// saxkung/sax-music-admin/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from "@/auth"; 

// ⭐️ ใช้ export default async function middleware(request: NextRequest)
export default async function middleware(request: NextRequest) {
  
  // 1. เรียกใช้ Auth Handler
  // Note: auth() สามารถคืนค่า Session | Response | null | undefined
  // @ts-ignore // ยังคงต้องใช้ @ts-ignore เพื่อเลี่ยง Type Incompatibility บน NextRequest
  const authResponse = await auth(request); 
  
  // 2. ⭐️ ตรวจสอบ Type: ถ้า authResponse เป็น Response Object จริงๆ
  // การใช้ instanceof Response ช่วยให้ TypeScript (และเรา) มั่นใจว่ามี .headers
  if (authResponse instanceof Response) {
    
    // 3. ตรวจสอบ Header 'location' ที่บ่งบอกว่า Next-Auth พยายาม Redirect
    const locationHeader = authResponse.headers?.get('location'); 

    // 4. ถ้ามี Header Location (หมายถึงมีการ Redirect จาก Next-Auth)
    if (locationHeader) {
      
      // 5. บังคับ Redirect ไปหน้า Login ด้วยตัวเองด้วยสถานะ 307
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      
      // ⭐️ บังคับใช้ 307 Temporary Redirect (แก้ปัญหา Cloudflare 404)
      return NextResponse.redirect(loginUrl, { status: 307 }); 
    }
    
    // 6. ถ้าเป็น Response แต่ไม่ใช่ Redirect (เช่น 401/403)
    return authResponse;
  }

  // 7. ถ้า authResponse เป็น Session object หรือ undefined/null (ผู้ใช้เข้าสู่ระบบแล้วหรืออนุญาต)
  // ให้ดำเนินการต่อ
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)',
  ],
};