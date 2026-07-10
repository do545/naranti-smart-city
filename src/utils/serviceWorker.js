/**
 * Service Worker utility module for offline media caching
 * Only runs in production mode
 */

/**
 * Register the service worker
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
  // Only register in production mode
  if (!import.meta.env.PROD) {
    console.log('[SW Utils] Service Worker registration skipped (development mode)');
    return null;
  }

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW Utils] Service Workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[SW Utils] Service Worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW Utils] New Service Worker available - refresh to update');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[SW Utils] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Send media URLs to service worker for precaching
 * @param {string[]} urls - Array of media URLs to precache
 * @returns {Promise<void>}
 */
export async function precacheMediaUrls(urls) {
  // Only run in production mode
  if (!import.meta.env.PROD) {
    console.log('[SW Utils] Precaching skipped (development mode)');
    return;
  }

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    console.warn('[SW Utils] No valid URLs provided for precaching');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('[SW Utils] Service Worker not available for precaching');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const targetWorker = navigator.serviceWorker.controller || registration.active;

    if (!targetWorker) {
      console.warn('[SW Utils] No active Service Worker for precaching');
      return;
    }

    targetWorker.postMessage({
      type: 'PRECACHE_URLS',
      urls
    });

    console.log(`[SW Utils] Sent ${urls.length} URLs to Service Worker for precaching`);
  } catch (error) {
    console.error('[SW Utils] Failed to send precache message:', error);
  }
}

/**
 * Clear the offline media cache
 * @returns {Promise<void>}
 */
export async function clearOfflineMediaCache() {
  // Only run in production mode
  if (!import.meta.env.PROD) {
    console.log('[SW Utils] Cache clearing skipped (development mode)');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('[SW Utils] Service Worker not available for cache clearing');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const targetWorker = navigator.serviceWorker.controller || registration.active;

    if (!targetWorker) {
      console.warn('[SW Utils] No active Service Worker for cache clearing');
      return;
    }

    targetWorker.postMessage({
      type: 'CLEAR_MEDIA_CACHE'
    });

    console.log('[SW Utils] Sent cache clear command to Service Worker');
  } catch (error) {
    console.error('[SW Utils] Failed to send clear cache message:', error);
  }
}