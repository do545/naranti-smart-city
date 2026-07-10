import { db } from '@/firebase/config';
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  query, where, orderBy, serverTimestamp
} from 'firebase/firestore';

// Feed de vacantes reales (lo escribe SOLO el backend — Cloud Functions).
const JOBS_COLLECTION = 'jobs';
// Vacantes locales curadas desde el panel admin (producto para negocios).
const LOCAL_JOBS_COLLECTION = 'jobs_local';

const CACHE_PREFIX = 'jobs_cache_v1:';

/** "Morelia, Michoacán" -> "morelia-michoacan" (mismo formato que el backend). */
export const toCityId = (city) =>
  String(city || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function readCache(cityId) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${cityId}`);
    if (!raw) return null;
    return JSON.parse(raw);
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
 * Ciudad del dispositivo: campo `city` (manual del admin) o `cityAuto`
 * (geocodificado por el backend a partir del heartbeat).
 */
export async function getDeviceCity(deviceEmail) {
  if (!deviceEmail) return null;
  try {
    const snap = await getDoc(doc(db, 'kiosks', deviceEmail.toLowerCase()));
    if (!snap.exists()) return null;
    const data = snap.data();
    return String(data.city || '').trim() || String(data.cityAuto || '').trim() || null;
  } catch (error) {
    console.error('Error leyendo ciudad del dispositivo:', error);
    return null;
  }
}

/**
 * Vacantes para una ciudad: locales curadas primero (destacadas), luego el
 * feed real de Jooble. Con caché en localStorage para operar offline.
 * Devuelve { jobs, updatedAt, fromCache }.
 */
export async function getJobsForCity(cityName) {
  const cityId = toCityId(cityName);
  if (!cityId) return { jobs: [], updatedAt: null, fromCache: false };

  try {
    // 1. Vacantes locales activas (de esta ciudad o marcadas para todas).
    const localQuery = query(
      collection(db, LOCAL_JOBS_COLLECTION),
      where('active', '==', true),
      where('cityId', 'in', [cityId, 'all'])
    );
    const localSnap = await getDocs(localQuery);
    const localJobs = localSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      isLocal: true,
      source: 'Naranti Local'
    }));

    // 2. Feed real por ciudad (escrito por el backend).
    const feedSnap = await getDoc(doc(db, JOBS_COLLECTION, cityId));
    const feedData = feedSnap.exists() ? feedSnap.data() : null;
    const feedJobs = (feedData?.jobs || []).map((job) => ({ ...job, isLocal: false }));

    const jobs = [...localJobs, ...feedJobs];
    const updatedAt = feedData?.updatedAt?.toDate?.()?.toISOString() || null;

    writeCache(cityId, { jobs, updatedAt });
    return { jobs, updatedAt, fromCache: false };
  } catch (error) {
    console.error('Error cargando vacantes, usando caché:', error);
    const cached = readCache(cityId);
    if (cached) return { ...cached, fromCache: true };
    return { jobs: [], updatedAt: null, fromCache: false };
  }
}

// ─────────────────── Administración (jobs_local) ───────────────────

export async function getLocalJobs() {
  const q = query(collection(db, LOCAL_JOBS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveLocalJob(id, data) {
  const jobId = id || `local_${Date.now()}`;
  await setDoc(doc(db, LOCAL_JOBS_COLLECTION, jobId), {
    ...data,
    cityId: data.cityId === 'all' ? 'all' : toCityId(data.city),
    updatedAt: serverTimestamp(),
    ...(id ? {} : { createdAt: serverTimestamp() })
  }, { merge: true });
  return jobId;
}

export async function deleteLocalJob(id) {
  await deleteDoc(doc(db, LOCAL_JOBS_COLLECTION, id));
}
