const CACHE = "field-map-v1";
const TILE_CACHE = "field-map-tiles-v1";
const OFFLINE_PAGE = "offline.html";

const APP_SHELL = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./icon-48.png",
  "./icon-96.png",
  "./icon-192.png",
  "./icon-512.png",
  "https://cdn.jsdelivr.net/npm/ol@v8.2.0/ol.css",
  "https://cdn.jsdelivr.net/npm/ol@v8.2.0/dist/ol.js",
  "https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.11.0/proj4.js",
  "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"
];

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "CACHE_TILES") {
    handleCacheTiles(event);
  }
  if (event.data && event.data.type === "CLEAR_TILE_CACHE") {
    handleClearTileCache(event);
  }
  if (event.data && event.data.type === "TILE_CACHE_SIZE") {
    handleTileCacheSize(event);
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== TILE_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  const isTile =
    /\/\d+\/\d+\/\d+\.(png|jpg|jpeg)/.test(url) ||
    url.includes("tile.openstreetmap") ||
    url.includes("tile.opentopomap") ||
    url.includes("arcgisonline.com");

  if (isTile) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request, { mode: "no-cors" })
            .then((response) => {
              if (response && (response.status === 200 || response.type === "opaque")) {
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
              { headers: { "Content-Type": "image/png" } }
            ));
        })
      )
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);
          const cached = await cache.match("./index.html")
            || await cache.match("./offline.html");
          return cached || new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match("./offline.html"));
    })
  );
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "content-sync") {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.text() : "New update available";
  event.waitUntil(
    self.registration.showNotification("Field Map", {
      body: data,
      icon: "./icon-192.png",
      badge: "./icon-96.png"
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("./index.html"));
});

async function handleCacheTiles(event) {
  const { urls } = event.data;
  const cache = await caches.open(TILE_CACHE);
  let done = 0;
  const total = urls.length;
  for (const url of urls) {
    try {
      const response = await fetch(url, { mode: "no-cors" });
      await cache.put(url, response);
    } catch (e) {}
    done++;
    event.source.postMessage({ type: "CACHE_PROGRESS", done, total });
  }
  event.source.postMessage({ type: "CACHE_DONE", total });
}

async function handleClearTileCache(event) {
  await caches.delete(TILE_CACHE);
  event.source.postMessage({ type: "TILE_CACHE_CLEARED" });
}

async function handleTileCacheSize(event) {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  event.source.postMessage({ type: "TILE_CACHE_SIZE_RESULT", count: keys.length });
}
