/* sax-music-admin/src/app/api/admin-proxy/[...path]/route.ts - PRODUCTION READY */
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ตรวจสอบ Environment Variables ตั้งแต่ต้น
if (!ADMIN_TOKEN || !API_URL) {
  console.error('❌ CRITICAL: Missing required environment variables');
  console.error('Required: ADMIN_TOKEN, NEXT_PUBLIC_API_URL');
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // 1. ตรวจสอบ Environment Variables
  if (!API_URL || !ADMIN_TOKEN) {
    console.error('❌ Missing environment variables');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const resolvedParams = await params;
  const apiPath = resolvedParams.path.join('/');
  
  // 2. Validate Path - ป้องกัน Path Traversal
  if (apiPath.includes('..') || apiPath.includes('//')) {
    console.error('❌ Invalid path detected:', apiPath);
    return NextResponse.json(
      { error: 'Invalid request path' },
      { status: 400 }
    );
  }

  const destinationURL = `${API_URL}/api/admin/${apiPath}`;

  // 3. Validate Destination URL
  try {
    const url = new URL(destinationURL);
    if (url.protocol !== 'https:') {
      console.error('❌ Non-HTTPS URL rejected:', destinationURL);
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error('❌ Invalid URL:', destinationURL);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }

  console.log(`📡 Proxying [${req.method}] to admin endpoint`);

  try {
    // 4. สร้าง Headers สำหรับ Worker
    const forwardHeaders = new Headers();
    forwardHeaders.set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    
    // Forward Content-Type ถ้ามี (สำคัญสำหรับ JSON และ FormData)
    const contentType = req.headers.get('content-type');
    if (contentType) {
      forwardHeaders.set('Content-Type', contentType);
    }

    let body: BodyInit | null = null;
    
    // 5. อ่าน Body สำหรับ POST/PUT/PATCH
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
      const rawRequest = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        // @ts-ignore
        duplex: 'half'
      });
      
      body = rawRequest.body;
    }

    // 6. ส่ง Request ไปยัง Worker
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: forwardHeaders,
      body: body,
      cache: 'no-store',
      // @ts-ignore
      duplex: 'half'
    };

    const res = await fetch(destinationURL, fetchOptions);

    // 7. Handle 204 No Content
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return NextResponse.json({ success: true }, { status: res.status });
    }

    // 8. Parse Response
    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error('❌ Failed to parse JSON response');
      
      return NextResponse.json(
        { 
          error: 'Invalid response from server',
          status: res.status
        },
        { status: 502 }
      );
    }

    // 9. Return Response
    if (!res.ok) {
      console.error('❌ Worker returned error status:', res.status);
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: res.status });

  } catch (e: any) {
    console.error('❌ Proxy Error:', e.message);
    
    return NextResponse.json(
      { 
        error: 'Service temporarily unavailable',
        // ไม่เปิดเผย details ใน production เว้นแต่เป็น development
        ...(process.env.NODE_ENV === 'development' && { 
          details: e.message 
        })
      },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;