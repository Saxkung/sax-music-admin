// src/lib/adminFetcher.ts

// ใช้ Next.js API Route Handler ที่เราสร้างไว้เป็น Proxy
const API_PROXY_URL = '/api/admin-proxy'; 

export async function adminFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_PROXY_URL}${endpoint}`, {
    ...options,
    // ไม่ต้องใส่ Authorization Header เพราะ Proxy จะใส่ให้
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();
  
  if (!res.ok) {
    // โยน Error ที่มีรายละเอียด Server ส่งกลับมา
    throw new Error(data.error || res.statusText);
  }

  return data as T;
}