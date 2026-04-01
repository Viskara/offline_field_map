const CACHE_NAME = 'field-map-v1';
const TILE_CACHE = 'field-map-tiles-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/ol@v8.2.0/ol.css',
  'https://cdn.jsdelivr.net/npm/ol@v8.2.0/dist/ol.js',
  'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.11.0/proj4.js',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== CACHE_NAME && k !== TILE_CACHE)
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  const isTile = /\/\d+\/\d+\/\d+\.(png|jpg|jpeg)/.test(url) ||
                 url.includes('tile.openstreetmap') ||
                 url.includes('tile.opentopomap') ||
                 url.includes('arcgisonline.com');

  if (isTile) {
    event.respondWith(
      caches.open(TILE_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request, { mode: 'no-cors' })
            .then(response => {
              if (response && (response.status === 200 || response.type === 'opaque')) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => new Response(
              new Uint8Array([
                137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,
                8,2,0,0,0,144,119,83,222,0,0,0,12,73,68,65,84,8,215,99,136,136,
                136,0,0,0,4,0,1,166,246,119,15,0,0,0,0,73,69,78,68,174,66,96,130
              ]).buffer,
              { headers: { 'Content-Type': 'image/png' } }
            ));
        })
      )
    );
    return;
  }

  if (APP_SHELL.some(u => url.endsWith(u) || url === u)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
});

self.addEventListener('message', async (event) => {
  if (event.data.type === 'CACHE_TILES') {
    const { urls } = event.data;
    const cache = await caches.open(TILE_CACHE);
    let done = 0;
    const total = urls.length;
    for (const url of urls) {
      try {
        const response = await fetch(url, { mode: 'no-cors' });
        await cache.put(url, response);
      } catch(e) {}
      done++;
      event.source.postMessage({ type: 'CACHE_PROGRESS', done, total });
    }
    event.source.postMessage({ type: 'CACHE_DONE', total });
  }

  if (event.data.type === 'CLEAR_TILE_CACHE') {
    await caches.delete(TILE_CACHE);
    event.source.postMessage({ type: 'TILE_CACHE_CLEARED' });
  }

  if (event.data.type === 'TILE_CACHE_SIZE') {
    const cache = await caches.open(TILE_CACHE);
    const keys = await cache.keys();
    event.source.postMessage({ type: 'TILE_CACHE_SIZE_RESULT', count: keys.length });
  }
});
