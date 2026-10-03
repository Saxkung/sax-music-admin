export async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (typeof options.body === 'string') headers.set('Content-Type', 'application/json');
  if (options.body instanceof FormData) headers.delete('Content-Type');
  const response = await fetch('/api/admin-proxy' + endpoint, { ...options, headers, cache: 'no-store', credentials: 'same-origin' });
  if (response.status === 401) { window.location.assign('/login'); throw new Error('Sign in to continue.'); }
  if (response.status === 204) return { success: true } as T;
  const data = await response.json().catch(() => ({ error: 'Service temporarily unavailable.' }));
  if (!response.ok) throw new Error(data.error || 'Unable to save. Try again.');
  return data as T;
}
