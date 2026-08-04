const CACHE_NAME = "inner-voice-v4";
const APP_SHELL = ["./manifest.json", "./install.html", "../icon.svg"];

const INSTALL_PROMPT = `
<section data-inner-voice-install-prompt style="margin:0 0 18px;padding:16px 18px;border:1px solid #ddd5c7;border-radius:18px;background:rgba(255,253,248,.92);box-shadow:0 12px 36px rgba(48,42,31,.06);line-height:1.65">
  <strong style="display:block;margin-bottom:5px;color:#24231f">把这个工具放到手机桌面</strong>
  <span style="color:#6f6b62;font-size:14px">iPhone：用 Safari 点“分享” → “添加到主屏幕”。Android：用 Chrome 点菜单 → “安装应用”或“添加到主屏幕”。</span>
  <a href="./install.html" style="display:inline-block;margin-left:8px;color:#2e6552;font-size:14px;font-weight:800;text-decoration:none">查看步骤 →</a>
</section>`;

function injectInstallPrompt(html) {
  if (html.includes("data-inner-voice-install-prompt")) return html;
  return html.replace('<main class="shell">', '<main class="shell">' + INSTALL_PROMPT);
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isMainPage = event.request.mode === "navigate" &&
    (url.pathname.endsWith("/inner-voice/") || url.pathname.endsWith("/inner-voice/index.html"));

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request, { cache: "no-store" });
      if (!isMainPage || !response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }

      const html = injectInstallPrompt(await response.text());
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      headers.delete("content-encoding");
      const transformed = new Response(html, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, transformed.clone()));
      return transformed;
    } catch {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      const fallback = await caches.match("./install.html");
      return fallback || Response.error();
    }
  })());
});
