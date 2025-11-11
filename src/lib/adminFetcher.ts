/* sax-music-admin/src/lib/adminFetcher.ts (Production) */
const API_PROXY_URL = '/api/admin-proxy';
const DIRECT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sax-music-api.skmyti00.workers.dev';

// ❌ (ลบออก) getAdminToken() ถูกลบออกทั้งหมดเพื่อความปลอดภัย

export async function adminFetch<T>(
  endpoint: string,
  options?: RequestInit & { skipProxy?: boolean } 
): Promise<T> {

  const skipProxy = options?.skipProxy || false;
  const baseURL = skipProxy ? DIRECT_API_URL : API_PROXY_URL;
  const fullURL = skipProxy 
    ? `${DIRECT_API_URL}/api/admin${endpoint}` 
    : `${API_PROXY_URL}${endpoint}`;

  const headers = new Headers(options?.headers);

  // ❌ (ลบออก) Logic 'if (skipProxy)' ที่เพิ่ม Auth header ถูกลบ
  // Browser จะจัดการส่ง httpOnly cookie ไปยัง Proxy เอง

  if (options?.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  if (options?.body instanceof FormData) {
    // ลบ Content-Type ถ้ามี (Browser จะตั้งค่าให้เอง)
    headers.delete('content-type');
    headers.delete('Content-Type');
  }

  const fetchOptions: RequestInit = {
    method: options?.method || 'GET',
    headers: headers,
    body: options?.body,
    // ✅ เพิ่ม cache: 'no-store' สำหรับ Production
    cache: 'no-store', 
  };

  try {
    const res = await fetch(fullURL, fetchOptions);

    if (res.status === 204) {
      return { success: true } as T;
    }

    let data: any;
    try {
      data = await res.json();
    } catch (e) {
      const text = await res.text().catch(() => 'Unreadable');
      throw new Error(
        `Failed to parse JSON: Server returned status ${res.status}. Body: ${text.substring(0, 200)}`
      );
    }

    // ✅ เพิ่มการจัดการ 401 (Unauthorized)
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'; // Redirect ถ้า Token หมดอายุ
      }
      throw new Error(data.error || 'Unauthorized');
    }

    if (!res.ok) {
      throw new Error(data.error || data.message || res.statusText);
    }

    return data as T;

  } catch (error: any) {
    throw error;
  }
}