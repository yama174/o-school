// 学校生活ポータル PWA用シンプルなService Worker。
// - HTMLナビゲーション: ネットワーク優先、失敗時はオフラインページ
// - 静的アセット(_next/static, アイコン等): キャッシュ優先
// ログイン状態や個人データに関わるAPI/フォーム送信はキャッシュしない。

const CACHE_NAME = "school-portal-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // 課題送信・投稿等のPOSTには介入しない

  const url = new URL(request.url);

  // ページ遷移(ナビゲーション)はネットワーク優先
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 静的アセットはキャッシュ優先
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return res;
          })
      )
    );
  }
});
