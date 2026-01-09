/**
 * Service Worker for PWA
 * オフライン対応とキャッシュ管理
 */

const CACHE_NAME = 'soccer-calendar-v1.0.1'
// baseパスを取得（Service Workerはグローバルスコープで実行されるため、self.location.pathnameから取得）
const BASE_PATH = self.location.pathname.replace(/\/sw\.js$/, '') || '/'
const MASTER_DATA_URL = BASE_PATH + (BASE_PATH.endsWith('/') ? '' : '/') + 'data/master-matches.json'

// インストール時にキャッシュ
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching files')
      return cache.addAll([
        BASE_PATH,
        MASTER_DATA_URL,
        // その他の静的リソースは自動的にキャッシュされる
      ]).catch((error) => {
        console.error('[Service Worker] Cache addAll error:', error)
      })
    })
  )
  self.skipWaiting()
})

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

// フェッチ時にキャッシュから取得
self.addEventListener('fetch', (event) => {
  // マスタデータは常にキャッシュから取得を試みる
  if (event.request.url.includes(MASTER_DATA_URL)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(event.request).then((response) => {
          // レスポンスをクローンしてキャッシュに保存
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
      })
    )
    return
  }

  // その他のリクエストはネットワーク優先、フォールバックでキャッシュ
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request)
    })
  )
})
