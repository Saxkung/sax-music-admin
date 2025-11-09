// src/app/api/admin-proxy/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server';

// อ่านค่าจาก .env.local (Server Side Only)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'S0809510733S@x'; // 🔧 Hardcode ชั่วคราว
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sax-music-api.skmyti00.workers.dev'; // 🔧 Hardcode ชั่วคราว

// นี่คือฟังก์ชัน Proxy หลัก
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // 🔍 Debug: ดูว่าอ่าน env ได้หรือไม่
  console.log('🔐 Proxy Debug:', {
    hasToken: !!ADMIN_TOKEN,
    hasApiUrl: !!API_URL,
    tokenValue: ADMIN_TOKEN ? '***' + ADMIN_TOKEN.slice(-4) : 'MISSING'
  });

  if (!API_URL || !ADMIN_TOKEN) {
    return NextResponse.json(
      { error: 'API URL หรือ Admin Token ไม่ได้ตั้งค่าใน Environment (Admin Project)' },
      { status: 500 }
    );
  }

  // 🔑 Await params ก่อนใช้ (Next.js 15+)
  const resolvedParams = await params;
  
  // 1. สร้าง URL ปลายทาง (ไปยัง Worker จริง)
  const apiPath = resolvedParams.path.join('/');
  const destinationURL = `${API_URL}/api/admin/${apiPath}`;
  
  console.log('📡 Proxying to:', destinationURL);

  // 2. สร้าง Headers ใหม่ (ไม่ copy จาก req.headers)
  const headers: HeadersInit = {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json',
  };
  
  // 🔍 Debug: ดู header ที่จะส่งไป
  console.log('📤 Sending Authorization:', `Bearer ${ADMIN_TOKEN}`);

  // 3. อ่าน body ถ้ามี
  let body: string | undefined = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      body = await req.text();
    } catch (e) {
      console.error('Error reading body:', e);
    }
  }

  // 4. ยิง Request ไปยัง Worker จริง
  try {
    const res = await fetch(destinationURL, {
      method: req.method,
      headers: headers,
      body: body,
    });
    
    console.log('📥 Worker response status:', res.status);
    
    const data = await res.json().catch(() => ({}));

    // 5. คืน Response ที่ได้จาก Worker กลับไปยัง Frontend
    return NextResponse.json(data, { status: res.status });

  } catch (e: any) {
    console.error('❌ Proxy Error:', e.message);
    return NextResponse.json({ 
      error: 'Proxy Error: Worker is unreachable or misconfigured',
      details: e.message 
    }, { status: 502 });
  }
}

// Next.js Route Handler จะใช้ฟังก์ชันเดียวสำหรับทุก Method
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;