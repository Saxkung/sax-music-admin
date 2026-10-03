type ProxyDependencies = {
  session: { user?: { role?: string } } | null;
  token?: string;
  upstream: (request: Request) => Promise<Response>;
  apiOrigin: string;
};
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (error: string, status: number) => Response.json({ error }, { status, headers });
function allowed(path: string, method: string) {
  if (/^(categories|projects)$/.test(path)) return ['GET', 'HEAD', 'POST'].includes(method);
  if (path === 'tracks') return method === 'POST';
  if (/^(categories|projects|tracks)\/reorder$/.test(path)) return method === 'PATCH';
  if (/^(categories|projects)\/[A-Za-z0-9_-]+$/.test(path)) return ['PUT', 'DELETE'].includes(method);
  if (/^tracks\/[A-Za-z0-9_-]+$/.test(path)) return ['GET', 'HEAD', 'PUT', 'DELETE'].includes(method);
  return path === 'upload/direct' && method === 'POST';
}
export async function forwardAdminRequest(request: Request, path: string[], dependencies: ProxyDependencies): Promise<Response> {
  if (dependencies.session?.user?.role !== 'admin') return json('Sign in to continue.', 401);
  if (!dependencies.token) return json('Server configuration error.', 503);
  if (path.some(part => !/^[A-Za-z0-9_-]+$/.test(part)) || !allowed(path.join('/'), request.method)) return json('Unsupported request.', 405);
  if (!['GET', 'HEAD'].includes(request.method)) {
    if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return json('Refresh this page and try again.', 403);
  }
  if (Number(request.headers.get('content-length')) > 52 * 1024 * 1024) return json('Each file must be 50 MB or smaller.', 413);
  try {
    const destination = new URL('/api/admin/' + path.join('/'), dependencies.apiOrigin);
    destination.search = new URL(request.url).search;
    const forwardHeaders = new Headers({ Authorization: `Bearer ${dependencies.token}` });
    const contentType = request.headers.get('content-type');
    if (contentType) forwardHeaders.set('Content-Type', contentType);
    const options: RequestInit & { duplex: 'half' } = { method: request.method === 'HEAD' ? 'GET' : request.method,
      headers: forwardHeaders, body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body, duplex: 'half', redirect: 'manual' };
    const result = await dependencies.upstream(new Request(destination, options));
    if (result.status >= 500) return json('Service temporarily unavailable. Try again.', 502);
    if (result.status >= 300 && result.status < 400) return json('Invalid service response.', 502);
    if (request.method === 'HEAD' || result.status === 204) return new Response(null, { status: result.status, headers });
    if (!result.headers.get('content-type')?.includes('application/json')) return json('Invalid service response.', 502);
    return new Response(result.body, { status: result.status, headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Admin API forwarding failed:', error instanceof Error ? error.message : 'Unknown error');
    return json('Service temporarily unavailable. Try again.', 502);
  }
}
