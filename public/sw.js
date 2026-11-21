// Kadr service worker: the app shell only (docs/decisions.md).
// - HTML: network first, the cached copy only when offline, so a release is never hidden by a stale page.
// - Hashed build files (/assets/*): cache first; a new release has new file names.
// - TMDB data and images are not cached here (TanStack Query and the browser cache handle them).
const CACHE = "kadr-shell-v1";
const SCOPE = new URL(self.registration.scope).pathname;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(SCOPE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(SCOPE, copy));
          }
          return response;
        })
        .catch(() => caches.match(SCOPE).then((cached) => cached || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith(`${SCOPE}assets/`)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
