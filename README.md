# Sax Music Studio

Production: https://admin.saxmusic.site

Next.js 16.3, React 19.3, Tailwind CSS 4.3 and Auth.js run on the Cloudflare Worker `sax-music-studio` through OpenNext. The authenticated server proxy calls the existing `sax-music-api` Worker through the `SAX_MUSIC_API` service binding; the browser never receives `ADMIN_TOKEN`. Existing D1 and R2 content stays in the API project.

## Workflow

- Search or filter the library, then open a project. Details, cover, tracks and publication are in one workspace.
- Create a draft, choose a cover and import audio files together. Track titles start from filenames. Prepared HLS folders can be imported with their relative manifest/segment paths preserved; this does not transcode audio.
- Preview or edit tracks in place. Arrow controls save the order immediately.
- Save project details with the save button or Ctrl/Cmd+S. Publish becomes available after a cover and track are present. Unsaved edits warn before leaving.
- Manage category visibility, names and order from Categories. Existing project and track deletions require confirmation.

Audio limit: 50 MB per file. Cover limit: 5 MB. Uploaded media remains public on `hls.saxmusic.site`, as the public music portfolio requires. Draft records are excluded from the public portfolio. Previous covers are retained to protect against failed saves; unused media cleanup is a separate deliberate task.

## Development and checks

Use Node 22.12 or newer. Install with `npm ci` or `bun install --frozen-lockfile`.

```sh
npm run dev
npm run lint
npm run typecheck
npm test
npm run build:worker
```

Local `.env.local` supplies `AUTH_SECRET`, `ADMIN_TOKEN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` and optional `API_URL`. Never commit this file. Production stores the same four authentication values as Worker secrets; `AUTH_URL` and `API_URL` are non-secret Wrangler variables. Configure secrets using `wrangler secret put` or `wrangler secret bulk` through standard input. All pages authorize on the server and every admin proxy request verifies the session separately. Writes also verify their Origin.

## Deployment

```sh
npm run deploy
```

This builds OpenNext and deploys the Worker route `admin.saxmusic.site/*` in the existing Cloudflare account. The old Pages project `sax-music-admin` remains only for its alias: its Git build uses root `legacy-pages`, an empty build command and output `.`. Its `sax-music-admin.pages.dev` URL redirects to the primary admin domain. Do not publish `.next` as static Pages assets; authentication and the proxy require the Worker runtime. Frontend deployment remains in the separate `portfolio-project-2` repository.

Auth.js remains on the compatible v5 beta line. TypeScript 5.9 is retained because the current ESLint TypeScript parser does not support the latest TypeScript 7 line. Test changes against both Node and the actual Cloudflare runtime; edge Request redirects use `manual` and explicitly reject upstream redirects.
