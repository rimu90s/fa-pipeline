// public/sw.js
const CACHE = "fa-pipeline-shell-v1";
const ASSETS = ["/", "/login", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Hanya cache GET dan hanya origin sendiri
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Jangan cache API (report/master/auth) agar tidak ada data stale/PII tersimpan
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
