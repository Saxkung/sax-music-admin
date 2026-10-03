import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forwardAdminRequest } from '../src/lib/proxy.ts';
const origin = 'https://admin.saxmusic.site';
const session = { user: { role: 'admin' } };
test('anonymous callers cannot reach the privileged backend', async () => {
  let called = false;
  const response = await forwardAdminRequest(new Request(origin + '/api/admin-proxy/projects'), ['projects'], { session: null, token: 'test', apiOrigin: 'https://api.test', upstream: async () => { called = true; return Response.json([]); } });
  assert.equal(response.status, 401); assert.equal(called, false);
});
test('cross-origin writes are rejected even with an admin session', async () => {
  const response = await forwardAdminRequest(new Request(origin + '/api/admin-proxy/projects', { method: 'POST', headers: { Origin: 'https://foreign.test' } }), ['projects'], { session, token: 'test', apiOrigin: 'https://api.test', upstream: async () => { throw new Error('must not reach backend'); } });
  assert.equal(response.status, 403);
});
test('authenticated uploads preserve multipart body, query and server-only authorization', async () => {
  const form = new FormData(); form.append('file', new File(['audio'], 'theme.mp3'));
  const response = await forwardAdminRequest(new Request(origin + '/api/admin-proxy/upload/direct?test=1', { method: 'POST', headers: { Origin: origin }, body: form }), ['upload', 'direct'], { session, token: 'test-secret', apiOrigin: 'https://api.test', upstream: async request => {
    assert.equal(request.redirect, 'manual'); assert.equal(request.headers.get('authorization'), 'Bearer test-secret'); assert.equal(new URL(request.url).search, '?test=1'); assert.equal((await request.formData()).get('file') instanceof File, true); return Response.json({ success: true });
  } });
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store'); assert.equal((await response.text()).includes('test-secret'), false);
});
test('204 responses remain empty and backend failures cannot leak details', async () => {
  const request = new Request(origin + '/api/admin-proxy/projects');
  const dependencies = { session, token: 'test', apiOrigin: 'https://api.test', upstream: async () => new Response(null, { status: 204 }) };
  const empty = await forwardAdminRequest(request, ['projects'], dependencies); assert.equal(empty.status, 204); assert.equal(await empty.text(), '');
  const failure = await forwardAdminRequest(request, ['projects'], { ...dependencies, upstream: async () => Response.json({ secret: 'internal-token', stack: 'internal-stack' }, { status: 500 }) });
  assert.equal(failure.status, 502); assert.doesNotMatch(await failure.text(), /internal-token|internal-stack/);
});
test('path traversal and arbitrary backend endpoints are rejected', async () => {
  for (const path of [['..', 'projects'], ['upload', 'presign'], ['secrets']]) {
    const response = await forwardAdminRequest(new Request(origin + '/api/admin-proxy/' + path.join('/')), path, { session, token: 'test', apiOrigin: 'https://api.test', upstream: async () => { throw new Error('must not reach backend'); } });
    assert.equal(response.status, 405);
  }
});
