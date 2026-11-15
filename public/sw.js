// The SynBy 0.9.60 (public)
const CACHE = 'synby-public-0.9.60';
const SHELL = ["./","./index.html","./app.js","./app.css","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png","./favicon-32.png"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload', redirect: 'manual' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('synby-public-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // 같은 주소 아래 public/ 은 배포용 앱 (자기 sw가 맡음)
  if (new URL(req.url).pathname.startsWith(new URL('./public/', self.location).pathname)) return;
  if (new URL(req.url).pathname.startsWith('/api/')) return; // 중계 서버는 그대로
  if (req.mode === 'navigate') {
    // 화면은 인터넷이 되면 새 것, 안 되면 담아 둔 것.
    // 문지기(로그인) 기간이 끝나 로그인 화면으로 보내려 하면 → 담아 둔 앱으로 열기 (?login 이 붙으면 로그인하러 감)
    if (new URL(req.url).searchParams.has('login')) return;
    // 원래 요청 그대로 보냄 (사파리는 '돌려보낸' 응답을 화면으로 쓰면 오류를 냄)
    const clean = async () => { const h = await caches.match('./index.html'); return h && h.ok && !h.redirected && h.type !== 'opaqueredirect' ? h : null; };
    e.respondWith(fetch(req).then(async (r) => {
      if (r.type === 'opaqueredirect' || (r.status >= 300 && r.status < 400)) return (await clean()) || r;
      return r;
    }).catch(async () => (await clean()) || Response.error()));
    return;
  }
  // 앱 파일(화면·글자·모양)은 인터넷이 되면 늘 새 것 (새 버전이 바로 열림), 안 되면 담아 둔 것
  const path = new URL(req.url).pathname, base = new URL('./', self.location).pathname;
  if (SHELL.some((u) => path === new URL(u, self.location).pathname) || path === base) {
    e.respondWith(fetch(req, { cache: 'no-cache', redirect: 'manual' }).then(async (res) => {
      if (res.ok && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(path, copy)); return res; }
      return (await caches.match(req, { ignoreSearch: true })) || res; // 로그인 기간이 끝났으면 담아 둔 것
    }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
