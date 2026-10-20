// Galaxy Ground Service Worker
// Provides offline fallback and basic caching for static assets.
//
// This is intentionally minimal.  Part 6 (if it exists) should replace this
// with a full Workbox-based service worker with runtime caching strategies
// for API responses, image optimisation, and background sync.
//
// TODO: After deployment, test offline behaviour and replace with a
// Workbox-generated service worker for production.

const CACHE = "galaxy-ground-v1";
const ASSETS_TO_CACHE = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS_TO_CACHE)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests for same-origin navigation.
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match("/offline")),
  );
});
