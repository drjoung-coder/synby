// The SynBy 0.3.4 (public)
const CACHE = 'synby-public-0.3.4';
const SHELL = ["./","./index.html","./app.js","./app.css","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png","./favicon-32.png"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('synby-public-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // 같은 주소 아래 public/ 은 배포용 앱 (자기 sw가 맡음)
  if (new URL(req.url).pathname.startsWith(new URL('./public/', self.location).pathname)) return;
  if (req.mode === 'navigate') {
    // 화면은 인터넷이 되면 새 것, 안 되면 담아 둔 것
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
