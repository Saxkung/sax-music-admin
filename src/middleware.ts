// saxkung/sax-music-admin/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from "@/auth"; 

// ⭐️ ใช้ export default async function middleware(request: NextRequest)
// เพื่อให้เป็นรูปแบบที่ Next.js App Router คาดหวัง
export default async function middleware(request: NextRequest) {
  
  // 1. เรียกใช้ Auth Handler
  // ⭐️ ใช้ @ts-ignore เพื่อเลี่ยง Type Error 'NextRequest' vs 'NextAuthRequest'
  // @ts-ignore
  const authResponse = await auth(request); 
  
  // 2. ถ้ามี Response จาก Auth Handler (Response object, ไม่ใช่ undefined/null)
  if (authResponse) {
    
    // 3. ⭐️ ใช้ Optional Chaining (?.) บน headers เพื่อแก้ Type Error
    const locationHeader = authResponse.headers?.get('location'); 

    // 4. ถ้ามี Header Location (หมายถึงมีการ Redirect จาก Next-Auth)
    if (locationHeader) {
      
      // 5. บังคับ Redirect ไปหน้า Login ด้วยตัวเองด้วยสถานะ 307
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      
      // ⭐️ บังคับใช้ 307 Temporary Redirect (แก้ปัญหา Cloudflare 404)
      return NextResponse.redirect(loginUrl, { status: 307 }); 
    }
    
    // 6. ถ้าไม่มีการ Redirect (เช่น เป็น 401/403 Response)
    return authResponse;
  }

  // 7. ถ้า authResponse เป็น undefined (อนุญาตให้เข้าถึง) 
  return NextResponse.next();
}

// ⭐️ ต้องมี export const config เหมือนเดิม
export const config = {
  matcher: [
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)',
  ],
};