/**
 * Clears application cache including localStorage, sessionStorage, and cached data structures
 * @param {Object} options - Configuration options for cache clearing
 * @param {boolean} options.includeAdsCache - Whether to clear ads-related cache
 * @param {boolean} options.includeKioskConfig - Whether to clear kiosk configuration cache
 */
export function clearAppCache(options = {}) {
  const {
    includeAdsCache = false,
    includeKioskConfig = false,
  } = options;

  try {
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      const shouldRemove =
        key === 'lastPlacesFetch' ||
        (includeKioskConfig && key === 'kiosk_config') ||
        (includeKioskConfig && key.startsWith('brightness_schedule_')) ||
        (includeKioskConfig && key.startsWith('naranti_role_cache_v1:')) ||
        (includeKioskConfig && key === 'naranti_last_device_session_v1') ||
        (includeAdsCache && key.startsWith('ads_cache_'));

      if (shouldRemove) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('clearAppCache failed:', error);
  }
}