/* Service Worker — Japa Sushi CBBA
   Estratégia:
   - Núcleo do app (HTML, CSS, JS do cardápio): network-first.
     Assim, toda edição no cardapio.js aparece na hora quando há internet,
     e o cache serve de reserva quando estiver offline.
   - Imagens e ícones: cache-first (carregam rápido e economizam dados). */
// v1: primeira versão do cardápio Japa Sushi CBBA.
const CACHE = "japasushicbba-v1";
const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./js/cardapio.js",
  "./js/app.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

function ehImagem(url) {
  return /\.(?:png|jpe?g|webp|gif|svg|ico)$/i.test(url);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Não interceptar chamadas externas (Google Maps, WhatsApp, Fontes, Meta Pixel).
  // O pixel precisa passar direto: cachear o script ou os beacons quebra a medição.
  if (req.url.includes("googleapis.com") || req.url.includes("gstatic.com") ||
      req.url.includes("wa.me") || req.url.includes("google.com/maps") ||
      req.url.includes("facebook.net") || req.url.includes("facebook.com")) return;

  // Imagens/ícones: cache-first
  if (ehImagem(req.url)) {
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }))
    );
    return;
  }

  // Núcleo do app: network-first (cai pro cache se estiver offline)
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
  );
});
