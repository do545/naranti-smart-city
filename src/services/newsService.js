import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { toCityId } from '@/services/jobsService';

// Feed de noticias reales por ciudad (lo escribe SOLO el backend — Cloud
// Functions parsea los RSS de medios locales y cachea aquí).
const NEWS_COLLECTION = 'news';
const CACHE_PREFIX = 'news_cache_v1:';

function readCache(cityId) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${cityId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(cityId, payload) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${cityId}`, JSON.stringify(payload));
  } catch {
    // Quota / private mode: ignorar.
  }
}

/**
 * Noticias del día para una ciudad, con caché localStorage para operar
 * offline. Devuelve { items, updatedAt, fromCache }.
 */
export async function getNewsForCity(cityName) {
  const cityId = toCityId(cityName);
  if (!cityId) return { items: [], updatedAt: null, fromCache: false };

  try {
    const snap = await getDoc(doc(db, NEWS_COLLECTION, cityId));
    if (!snap.exists()) {
      const cached = readCache(cityId);
      if (cached) return { ...cached, fromCache: true };
      return { items: [], updatedAt: null, fromCache: false };
    }

    const data = snap.data();
    const payload = {
      items: data.items || [],
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
    };
    writeCache(cityId, payload);
    return { ...payload, fromCache: false };
  } catch (error) {
    console.error('Error cargando noticias, usando caché:', error);
    const cached = readCache(cityId);
    if (cached) return { ...cached, fromCache: true };
    return { items: [], updatedAt: null, fromCache: false };
  }
}
