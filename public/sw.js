/* Naranti Smart City — Service Worker (offline media cache)
 *
 * Goals:
 * - Keep ads running offline by caching image/video URLs previously fetched online.
 * - Avoid interfering with Firebase/Firestore requests (only handle media + app shell).
 *
 * Notes:
 * - Service workers require HTTPS (or localhost).
 * - Video offline is best-effort; we support Range requests when a full file is cached.
 */

const VERSION = 'v1';
const STATIC_CACHE = `naranti-static-${VERSION}`;
const MEDIA_CACHE = `naranti-media-${VERSION}`;

const MAX_MEDIA_ENTRIES = 250;
const inFlightFullVideo = new Map();

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    // Install fast; pre-cache the shell best-effort.
    try {
      const cache = await caches.open(STATIC_CACHE);
      // Important: cache entries one-by-one so a missing `/index.html`
      // doesn't cause the whole install pre-cache to fail.
      await cache.add('/').catch(() => { });
      await cache.add('/index.html').catch(() => { });
      await cache.add('/offline-fallback.svg').catch(() => { });

      // Best-effort: precache hashed assets referenced by index.html (Vite build),
      // so the very first offline reload doesn't end in a blank screen.
      try {
        const res = await fetch('/index.html', { cache: 'reload' });
        if (res && (res.ok || res.type === 'opaque')) {
          const html = await res.clone().text().catch(() => '');
          const assetPaths = extractSameOriginAssetPathsFromHtml(html);
          await precacheStaticAssets(assetPaths);
        }
      } catch (error) {
        // Ignore.
      }
    } catch (error) {
      // Ignore install caching errors (offline / first deploy race).
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith('naranti-') && ![STATIC_CACHE, MEDIA_CACHE].includes(k))
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

function isCacheableUrl(url) {
  if (!url) return false;
  if (url.startsWith('blob:') || url.startsWith('data:')) return false;
  if (url.startsWith('chrome-extension:')) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

async function trimMediaCache(cache) {
  try {
    const keys = await cache.keys();
    const overflow = keys.length - MAX_MEDIA_ENTRIES;
    if (overflow <= 0) return;
    // Best-effort FIFO trim (keys() is typically insertion-ordered).
    await Promise.all(keys.slice(0, overflow).map((req) => cache.delete(req)));
  } catch (error) {
    // Ignore trimming errors.
  }
}

function shouldCacheMediaRequest(request) {
  try {
    const url = new URL(request.url);
    if (url.origin === self.location.origin) return true;

    // Allow the main media sources we use for ads.
    const host = url.hostname;
    if (host === 'firebasestorage.googleapis.com') return true;
    if (host === 'images.unsplash.com') return true;

    return false;
  } catch (error) {
    return false;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Cache opaque responses too (cross-origin media usually is opaque).
    try {
      const shouldCache = cacheName !== MEDIA_CACHE || shouldCacheMediaRequest(request);
      const cacheableResponse = response && (response.ok || response.type === 'opaque');
      const isPartialVideo = request.destination === 'video' && response && response.status === 206;
      if (shouldCache && cacheableResponse && !isPartialVideo) {
        await cache.put(request, response.clone());
        if (cacheName === MEDIA_CACHE) await trimMediaCache(cache);
      }
    } catch (error) {
      // Ignore cache put failures (quota/cors).
    }
    return response;
  } catch (error) {
    // When offline (or fetch fails), never reject for media requests — return a harmless response.
    // This avoids "Uncaught (in promise) TypeError: Failed to fetch" noise and broken SW fetch events.
    if (request.destination === 'image') return new Response(null, { status: 204 });
    if (request.destination === 'video') return new Response(null, { status: 504 });
    throw error;
  }
}

async function ensureFullVideoCached(url) {
  if (!url) return;
  if (!shouldCacheMediaRequest(new Request(url))) return;

  const existing = inFlightFullVideo.get(url);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const cache = await caches.open(MEDIA_CACHE);
      const cached = await cache.match(url, { ignoreVary: true });

      // If we already have a readable full body, keep it.
      if (cached && cached.status === 200 && cached.type !== 'opaque' && cached.status !== 0) return;

      const res = await fetch(new Request(url, { mode: 'cors', credentials: 'omit', cache: 'reload' }));
      if (!res) return;
      if (!res.ok && res.type !== 'opaque') return;
      // Only cache full responses (avoid storing 206 Partial Content).
      if (res.status === 206) return;

      await cache.delete(url, { ignoreVary: true }).catch(() => { });
      await cache.put(url, res.clone());
      await trimMediaCache(cache);
    } catch (error) {
      // Ignore.
    } finally {
      inFlightFullVideo.delete(url);
    }
  })();

  inFlightFullVideo.set(url, promise);
  return promise;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    try {
      await cache.put(request, response.clone());
    } catch (error) {
      // Ignore.
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;
    throw error;
  }
}

function parseRangeHeader(rangeHeader) {
  // Example: "bytes=0-1023"
  if (!rangeHeader) return null;
  const match = /^bytes=(\d+)-(\d+)?$/i.exec(rangeHeader.trim());
  if (!match) return null;
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : null;
  if (!Number.isFinite(start) || (end != null && !Number.isFinite(end))) return null;
  return { start, end };
}

async function respondFromCachedVideoRange(request) {
  const rangeHeader = request.headers.get('range');
  const parsed = parseRangeHeader(rangeHeader);
  if (!parsed) return null;

  try {
    const cache = await caches.open(MEDIA_CACHE);
    // Cached by URL (full file).
    const cached = await cache.match(request.url, { ignoreVary: true });
    if (!cached) return null;

    // Only works if we cached the full body (status 200). If cached is partial, fall back.
    if (cached.status && cached.status !== 200) return null;

    // Opaque responses (no-cors) cannot be read; we'll fall back to serving the full cached response.
    // Range slicing is best-effort only.
    if (cached.type === 'opaque' || cached.status === 0) return null;

    const buffer = await cached.arrayBuffer();
    const total = buffer.byteLength;
    const start = Math.min(parsed.start, total);
    const endInclusive = parsed.end == null ? (total - 1) : Math.min(parsed.end, total - 1);

    if (start > endInclusive) {
      return new Response(null, {
        status: 416,
        headers: {
          'Content-Range': `bytes */${total}`,
        },
      });
    }

    const chunk = buffer.slice(start, endInclusive + 1);
    const contentType = cached.headers.get('Content-Type') || 'video/mp4';

    return new Response(chunk, {
      status: 206,
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunk.byteLength),
        'Content-Range': `bytes ${start}-${endInclusive}/${total}`,
      },
    });
  } catch (error) {
    return null;
  }
}

function extractSameOriginAssetPathsFromHtml(html) {
  const paths = new Set();
  if (!html) return [];

  // Vite typically injects assets like:
  // <script type="module" crossorigin src="/assets/index-xxxx.js"></script>
  // <link rel="stylesheet" crossorigin href="/assets/index-xxxx.css">
  const re = /(?:href|src)=["'](\/assets\/[^"']+)["']/g;
  let match;
  while ((match = re.exec(html))) {
    const path = match[1];
    if (typeof path === 'string' && path.startsWith('/assets/')) paths.add(path);
  }
  return Array.from(paths);
}

async function precacheStaticAssets(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return;

  const cache = await caches.open(STATIC_CACHE);
  await Promise.all(paths.map(async (path) => {
    try {
      const existing = await cache.match(path, { ignoreVary: true });
      if (existing) return;

      const req = new Request(path, { cache: 'reload' });
      const res = await fetch(req);
      if (!res) return;
      if (!res.ok && res.type !== 'opaque') return;
      await cache.put(path, res.clone());
    } catch (error) {
      // Ignore individual asset precache errors.
    }
  }));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // 1) SPA navigation: network-first, fall back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);

      try {
        const response = await fetch(request);

        // Cache the app shell under a stable key so offline reload works
        // even if caching the original "navigate" request fails.
        try {
          await cache.put('/__shell__', response.clone());
        } catch (error) {
          // Ignore.
        }

        // Also cache the specific navigation request best-effort.
        try {
          await cache.put(request, response.clone());
        } catch (error) {
          // Ignore.
        }

        // Best-effort: parse the HTML shell to discover hashed Vite assets and cache them.
        // This prevents a "black screen" on the first offline reload after installing the SW.
        try {
          const cloned = response.clone();
          const contentType = cloned.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            const html = await cloned.text();
            const assetPaths = extractSameOriginAssetPathsFromHtml(html);
            event.waitUntil(precacheStaticAssets(assetPaths));
          }
        } catch (error) {
          // Ignore parsing/precache errors.
        }

        return response;
      } catch (error) {
        // Try request-specific cache first.
        const cached = await cache.match(request, { ignoreVary: true });
        if (cached) return cached;

        // Then fall back to the cached shell.
        const shell = await cache.match('/__shell__')
          || await cache.match('/')
          || await cache.match('/index.html');
        if (shell) return shell;

        throw error;
      }
    })());
    return;
  }

  const destination = request.destination;

  // 2) Images: cache-first
  if (destination === 'image') {
    event.respondWith(cacheFirst(request, MEDIA_CACHE));
    return;
  }

  // 3) Videos: Range-support from cache when available
  if (destination === 'video') {
    event.respondWith((async () => {
      // If this is a Range request and we have the full file cached, serve the slice.
      if (request.headers.has('range')) {
        const ranged = await respondFromCachedVideoRange(request);
        if (ranged) return ranged;
        // Otherwise fall back to the full cached response (some players accept 200 for range requests),
        // and only if missing, fall through to network.
        const cache = await caches.open(MEDIA_CACHE);
        const cached = await cache.match(request.url, { ignoreVary: true });
        if (cached) {
          // If the cached response isn't a readable full 200, try to upgrade it in the background.
          if (cached.type === 'opaque' || cached.status === 0 || cached.status === 206) {
            event.waitUntil(ensureFullVideoCached(request.url));
          }
          return cached;
        }
        // Warm the cache for the next offline run.
        event.waitUntil(ensureFullVideoCached(request.url));
        try {
          return await fetch(request);
        } catch (error) {
          return new Response(null, { status: 504 });
        }
      }

      // Non-range video requests can be cached normally.
      return cacheFirst(request, MEDIA_CACHE);
    })());
    return;
  }

  // 4) App static assets: network-first with cache fallback.
  try {
    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;
    const isStaticAsset =
      sameOrigin &&
      (url.pathname === '/' ||
        url.pathname === '/index.html' ||
        url.pathname.startsWith('/assets/') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.svg'));

    if (isStaticAsset) {
      event.respondWith(networkFirst(request, STATIC_CACHE));
    }
  } catch (error) {
    // Ignore URL parse errors and do not hijack the request.
  }
});

self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'CLEAR_MEDIA_CACHE') {
    event.waitUntil(caches.delete(MEDIA_CACHE));
    return;
  }

  if (data.type === 'PRECACHE_URLS') {
    const urls = Array.isArray(data.urls)
      ? data.urls
      : (Array.isArray(data.data?.urls) ? data.data.urls : []);
    const unique = Array.from(new Set(urls))
      .filter(isCacheableUrl)
      .filter((url) => shouldCacheMediaRequest(new Request(url)));

    event.waitUntil((async () => {
      if (unique.length === 0) return;
      const cache = await caches.open(MEDIA_CACHE);

      for (const url of unique) {
        try {
          const exists = await cache.match(url, { ignoreVary: true });
          // If we already have a non-opaque entry, keep it (important for video Range slicing).
          if (exists && exists.type !== 'opaque' && exists.status !== 0) continue;

          // Prefer CORS fetch so videos can be served via Range (206) when offline.
          let response;
          try {
            response = await fetch(new Request(url, { mode: 'cors', credentials: 'omit' }));
          } catch (error) {
            // Fallback to opaque caching only as a last resort.
            response = await fetch(new Request(url, { mode: 'no-cors', credentials: 'omit' }));
          }

          // Ensure we replace any previous (possibly opaque) entry for the same URL.
          await cache.delete(url, { ignoreVary: true }).catch(() => { });
          await cache.put(url, response);
          await trimMediaCache(cache);
        } catch (error) {
          // Ignore individual URL failures.
        }
      }
    })());
  }
});