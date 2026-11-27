import { omitUnchangedMedia } from '../src/lib/studio.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forwardAdminRequest } from '../src/lib/proxy.ts';
import nextConfig from '../next.config.ts';
const origin = 'https://admin.saxmusic.work';
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
test('Studio loads migrated covers and HLS from the configured media host', async () => {
  const rules = await nextConfig.headers?.();
  const policy = rules?.[0].headers.find(header => header.key === 'Content-Security-Policy')?.value;
  assert.ok(policy);
  for (const directive of ['img-src', 'connect-src', 'media-src']) {
    const sources: string[] | undefined = policy.split(';').map(value => value.trim().split(/\s+/)).find(([key]) => key === directive);
    assert.ok(sources?.includes('https://hls.saxmusic.work'));
    assert.equal(sources?.includes('https://hls.saxmusic.site'), false);
  }
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

test('metadata edits leave a stored legacy cover unchanged', () => {
  const draft = { title: 'New title', image: '/covers/existing.jpg' };
  assert.deepEqual(omitUnchangedMedia(draft, 'image', draft.image), { title: 'New title' });
  assert.equal(draft.image, '/covers/existing.jpg');
  const replacement = { ...draft, image: 'https://hls.saxmusic.work/covers/new.jpg', tempImageKey: 'uploads/new.jpg' };
  assert.deepEqual(omitUnchangedMedia(replacement, 'image', draft.image), replacement);
  assert.deepEqual(omitUnchangedMedia({ ...draft, tempImageKey: replacement.tempImageKey }, 'image', draft.image), { title: draft.title, tempImageKey: replacement.tempImageKey });
  assert.deepEqual(omitUnchangedMedia({ ...draft, image: '' }, 'image', draft.image), { title: draft.title, image: '' });
});

test('metadata edits omit an unchanged track URL, but new and replaced tracks send it', () => {
  const track = { title: 'New title', src: 'https://hls.saxmusic.work/tracks/existing.mp3' };
  assert.deepEqual(omitUnchangedMedia(track, 'src', track.src), { title: 'New title' });
  assert.deepEqual(omitUnchangedMedia(track, 'src', undefined), track);
  assert.deepEqual(omitUnchangedMedia(track, 'src', 'https://hls.saxmusic.work/tracks/old.mp3'), track);
});
