// Cargas · service worker — fuerza siempre la última versión de index.html cuando hay internet
const CACHE = "cargas-v19jun-2";
const CORE = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (req.method !== "GET" || url.origin !== location.origin) return; // Firebase/fonts pasan directo

  const isIndex = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html");
  if (isIndex) {
    e.respondWith((async () => {
      try {
        const net = await fetch(req, { cache: "no-store" }); // ← clave: ignora la caché vieja
        const c = await caches.open(CACHE);
        c.put("./index.html", net.clone());
        return net;
      } catch (_) {
        return (await caches.match(req)) || (await caches.match("./index.html"));
      }
    })());
    return;
  }
  e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
