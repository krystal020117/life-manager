const CACHE = 'life-manager-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// 安装新版本
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 新版本立即接管
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 页面优先拿最新版本
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // HTML：优先网络，保证新版本及时更新
  if (event.request.mode === 'navigate' ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('/')) {

    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache =>
            cache.put(event.request, copy)
          );
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(
            response => response || caches.match('./index.html')
          )
        )
    );

    return;
  }

  // 其他文件：缓存优先，网络兜底
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
