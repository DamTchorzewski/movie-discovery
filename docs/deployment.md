# Deployment

The app is static (`pnpm build` writes `dist/`) and is published to GitHub Pages by `.github/workflows/deploy.yml`, at
<https://damtchorzewski.github.io/movie-discovery/>. The browser calls the TMDB API directly; there is no server.

## What runs when

| Event             | What happens                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| pull request      | `ci.yml`: `pnpm check` (format, lint, types, unit), then `pnpm test:e2e` on desktop and a phone     |
| push to `develop` | CI without e2e (its pull request ran it), `pnpm build`; the build is an artifact for 14 days        |
| push to `main`    | CI with e2e, the build with the TMDB key, publish to Pages, then `pnpm health` checks the live site |
| run by hand       | Actions → Build & Deploy (or CI) → Run workflow                                                     |

A change to the documentation only (`*.md`, `docs/`, `LICENSE`, `.env.example`) starts nothing.

## Variables

| Name                | Kind     | Where                           | Required       | Empty                                                            |
| ------------------- | -------- | ------------------------------- | -------------- | ---------------------------------------------------------------- |
| `VITE_TMDB_API_KEY` | variable | `.env.local`; repository        | yes, on `main` | the app shows "The TMDB key is missing"; the `main` build stops  |
| `SITE_URL`          | variable | repository (custom domain only) | no             | the workflow uses the Pages address; locally `/movie-discovery/` |

`VITE_TMDB_API_KEY` ships to the browser on purpose: a static site cannot hide a key, and TMDB cannot restrict a key to
a domain. It is therefore a **variable**, not a secret, and it is never committed (`.env.local` is git-ignored).
How to get it: themoviedb.org → Settings → API → API Key (v3). The key of the first version was committed in
`tmdb-movie-browser`, so a **new key** is used here. Tests never need it: the e2e build uses a fake key and every request
is answered from `tests/e2e/fixtures`.

## Paths on GitHub Pages

Pages cannot rewrite paths, so the build writes:

- `index.html` copies for the pages without data (`discover/`, `search/`, `library/`, `tonight/`, `about/` and the same
  under `en/`), which answer 200;
- `404.html`, the same app, for every other path (a film, a person, a collection). Those answer 404 with the working
  page; the router shows the right screen.

## Security

GitHub Pages cannot send headers, so the policy is a `<meta http-equiv="Content-Security-Policy">` written at build
time (`vite.config.ts`), with the SHA-256 hash of the one inline script (theme before the first paint). Allowed hosts:
`api.themoviedb.org` (connect), `image.tmdb.org` (images), `www.youtube-nocookie.com` (trailer frame, loaded only after
a click). The e2e tests fail on any console error, so a missing host is caught before a release.

## Health check

`pnpm health` (`scripts/health.mjs`) requests the home page, Discover, My films, Tonight, the English home, a film path
(expects the 404 fallback with the app), the manifest and the service worker. Read-only, no dependencies, no TMDB call:
`SITE_URL=https://damtchorzewski.github.io/movie-discovery/ pnpm health`.

## Local build

```bash
pnpm build && pnpm preview   # http://localhost:4173/movie-discovery/
```

## Pausing and rollback

Pause: Actions → Build & Deploy → ⋯ → Disable workflow. Rollback: revert the commit on a working branch and release it
the usual way, or re-run an earlier successful run of the workflow on `main`.
