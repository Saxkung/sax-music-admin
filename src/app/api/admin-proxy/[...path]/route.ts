import { auth } from '@/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { forwardAdminRequest } from '@/lib/proxy';
export async function handler(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Sign in to continue.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const { path } = await context.params;
  let service: { fetch(request: Request): Promise<Response> } | undefined;
  if (process.env.NODE_ENV === 'production') {
    try { const cloudflare = await getCloudflareContext({ async: true }); service = (cloudflare.env as unknown as { SAX_MUSIC_API?: typeof service }).SAX_MUSIC_API; } catch { /* next start uses HTTPS upstream */ }
  }
  const apiOrigin = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://sax-music-api.skmyti00.workers.dev';
  const url = new URL(apiOrigin);
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV === 'development' && ['localhost', '127.0.0.1'].includes(url.hostname))) return Response.json({ error: 'Invalid service configuration.' }, { status: 503 });
  return forwardAdminRequest(request, path, { session, token: process.env.ADMIN_TOKEN, apiOrigin,
    upstream: service ? (req) => service!.fetch(req) : (req) => fetch(req, { cache: 'no-store' }) });
}
export { handler as GET, handler as HEAD, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
