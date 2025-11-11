// src/app/api/auth/logout/route.ts (แก้ไข)
import { NextResponse } from 'next/server';
// ⭐️ 1. ลบ 'cookies' ออกจาก import นี้
// import { cookies } from 'next/headers'; 

const AUTH_COOKIE_NAME = 'sax-admin-token';

export async function POST(req: Request) {
  try {
    // ⭐️ --- START EDIT (The REAL Fix) ---
    
    // 1. สร้าง NextResponse (แบบ redirect) ก่อน
    const response = NextResponse.redirect(new URL('/login', req.url));

    // 2. เรียก .cookies.set() บน response object เพื่อลบ cookie
    response.cookies.set(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: -1, // ลบทันที
    });

    // 3. คืนค่า response
    return response;
    // ⭐️ --- END EDIT ---

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}