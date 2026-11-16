/* Change VERSION whenever you update an app file. */
const VERSION = 'v1';

const PREFIX =
  'ghostkeys-' + new URL(self.registration.scope).pathname + '-';

const CACHE = PREFIX + VERSION;

const ASSETS = [
  './',
  './index.html',
  './theme.css',
  './rain.js',
  './app.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) {
        await caches.delete(key);
      }
    }

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    !url.href.startsWith(self.registration.scope)
  ) return;

  const isAsset = ASSETS.some(path =>
    new URL(path, self.registration.scope).href === url.href
  );

  if (!isAsset && request.mode !== 'navigate') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request, {
      ignoreSearch: true
    });

    if (hit) return hit;

    try {
      return await fetch(request);
    } catch (error) {
      if (request.mode === 'navigate') {
        return (
          await cache.match('./index.html')
        ) || Response.error();
      }

      throw error;
    }
  })());
});
