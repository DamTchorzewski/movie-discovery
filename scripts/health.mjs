// Smoke check of the live site after a deploy: the pages, the English version, a film path served by the
// 404.html fallback, the manifest and the service worker. Read-only, no dependencies, no TMDB call.
// Usage: SITE_URL=https://<owner>.github.io/movie-discovery/ pnpm health   (the deploy workflow runs it)
const raw = process.env.SITE_URL?.trim();
if (!raw) {
  console.error("health: SITE_URL is not set");
  process.exit(1);
}
const base = raw.endsWith("/") ? raw : `${raw}/`;

const checks = [
  { path: "", status: 200, contains: "<title>Frame" },
  { path: "discover/", status: 200, contains: 'id="root"' },
  { path: "library/", status: 200, contains: 'id="root"' },
  { path: "tonight/", status: 200, contains: 'id="root"' },
  { path: "en/", status: 200, contains: 'id="root"' },
  // GitHub Pages answers a film path with 404.html, which is the same app
  { path: "movie/550-fight-club/", status: 404, contains: 'id="root"' },
  { path: "manifest.webmanifest", status: 200, contains: '"name": "Frame"' },
  { path: "sw.js", status: 200, contains: "kadr-shell" },
];

let failed = false;
for (const { path, status, contains } of checks) {
  const url = `${base}${path}`;
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "cache-control": "no-cache" },
    });
    const body = await response.text();
    const ok = response.status === status && body.includes(contains);
    console.log(`${ok ? "ok  " : "FAIL"} ${response.status} ${url}`);
    if (!ok) failed = true;
  } catch (error) {
    console.log(`FAIL ${url} (${error instanceof Error ? error.message : error})`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
