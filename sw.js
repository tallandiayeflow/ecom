const CACHE_NAME = "noor-cache-v1";

// Installer → activer immédiatement
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activation → nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Gestion des requêtes
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // NE JAMAIS intercepter les fichiers statiques
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".json")
  ) {
    return; // réseau normal
  }

  // fallback SPA React
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => fetch("/index.html")));
    return;
  }

  // cache simple pour autres requêtes
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});