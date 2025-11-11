// src/app/api/auth/login/route.ts (แก้ไข)
import { NextResponse } from 'next/server';
// ⭐️ 1. ลบ 'cookies' ออกจาก import นี้ (เราไม่จำเป็นต้องใช้มันแล้ว)
// import { cookies } from 'next/headers';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const AUTH_COOKIE_NAME = 'sax-admin-token';

export async function POST(req: Request) {
  if (!ADMIN_TOKEN) {
    return NextResponse.json(
      { error: 'Admin token is not configured on the server' },
      { status: 500 }
    );
  }

  try {
    const { password } = await req.json();

    if (password === ADMIN_TOKEN) {
      
      // ⭐️ --- START EDIT (The REAL Fix) ---
      
      // 1. สร้าง NextResponse ก่อน
      const response = NextResponse.json({ success: true });

      // 2. เรียก .cookies.set() บน response object
      response.cookies.set(AUTH_COOKIE_NAME, ADMIN_TOKEN, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 วัน
        sameSite: 'lax',
      });
      
      // 3. คืนค่า response
      return response;
      // ⭐️ --- END EDIT ---

    } else {
      // รหัสผ่านผิด
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}