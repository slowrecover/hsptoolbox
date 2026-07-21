const CACHE_NAME = 'emotion-log-v3';
const APP_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './browser-copy.js',
  '../qingxu.html',
  '../icon-emotion.svg'
];

function isShellUrl(url) {
  return url.pathname.endsWith('/emotion/') || url.pathname.endsWith('/emotion/index.html');
}

async function injectBrowserNeutralCopy(response) {
  if (!response || !response.ok) return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const text = await response.text();
  const patched = text.includes('browser-copy.js')
    ? text
    : text.replace('</body>', '  <script src="./browser-copy.js"></script>\n</body>');

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(patched, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_ASSETS.map(async asset => {
      const response = await fetch(asset);
      const prepared = asset === './' || asset === './index.html'
        ? await injectBrowserNeutralCopy(response)
        : response;
      await cache.put(asset, prepared);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('emotion-log-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isEmotionAsset = url.pathname.includes('/emotion/')
    || url.pathname.endsWith('/qingxu.html')
    || url.pathname.endsWith('/icon-emotion.svg');
  if (!isEmotionAsset) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      const prepared = isShellUrl(url)
        ? await injectBrowserNeutralCopy(response)
        : response;
      if (prepared && prepared.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, prepared.clone());
      }
      return prepared;
    } catch (_) {
      return (await caches.match(event.request)) || caches.match('./index.html');
    }
  })());
});
