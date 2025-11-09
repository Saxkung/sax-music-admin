// src/app/api/admin-proxy/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server';

// อ่านค่าจาก .env.local (Server Side Only)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
// Next.js จะโหลด NEXT_PUBLIC_API_URL มาจาก env.local โดยอัตโนมัติ
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// นี่คือฟังก์ชัน Proxy หลัก
async function handler(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  if (!API_URL || !ADMIN_TOKEN) {
    return NextResponse.json(
      { error: 'API URL หรือ Admin Token ไม่ได้ตั้งค่าใน Environment (Admin Project)' },
      { status: 500 }
    );
  }

  // 1. สร้าง URL ปลายทาง (ไปยัง Worker จริง)
  const apiPath = params.path.join('/');
  // ตัวอย่าง: https://sax-music-api.workers.dev/api/admin/projects
  const destinationURL = `${API_URL}/api/admin/${apiPath}`;

  // 2. สร้าง Headers พร้อมแนบ Token
  const headers = new Headers(req.headers);
  headers.set('Authorization', `Bearer ${ADMIN_TOKEN}`); // ✅ หัวใจความปลอดภัย: แอบใส่ Token ที่นี่
  headers.set('Content-Type', 'application/json');

  // 3. สร้าง Request ใหม่
  const proxyRequest = new Request(destinationURL, {
    method: req.method,
    headers: headers,
    body: req.body, // ส่ง Body ต่อไป
    redirect: 'manual',
  });

  // 4. ยิง Request ไปยัง Worker จริง
  try {
    const res = await fetch(proxyRequest);
    const data = await res.json().catch(() => ({})); // พยายามอ่าน JSON

    // 5. คืน Response ที่ได้จาก Worker กลับไปยัง Frontend
    return NextResponse.json(data, { status: res.status });

  } catch (e: any) {
    return NextResponse.json({ error: 'Proxy Error: Worker is unreachable or misconfigured' }, { status: 502 });
  }
}

// Next.js Route Handler จะใช้ฟังก์ชันเดียวสำหรับทุก Method
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;