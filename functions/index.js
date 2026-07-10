/**
 * Naranti Analytics Smart City — Backend (Cloud Functions v2)
 * ----------------------------------------------------------------------------
 * Módulo de Empleos:
 *   - refreshJobs      -> programada cada 12h: detecta la ciudad de cada
 *                         dispositivo de la flota y trae vacantes reales de
 *                         Jooble para cada ciudad, cacheándolas en Firestore
 *                         (colección `jobs`, doc id = ciudad normalizada).
 *   - refreshJobsNow   -> callable SOLO para admins: mismo refresco bajo demanda
 *                         desde el panel.
 *
 * Seguridad:
 *   - La clave de Jooble vive en Secret Manager (JOOBLE_API_KEY), nunca en el
 *     bundle del cliente.
 *   - `jobs` y `jobs_local` son de solo lectura para la flota; solo este
 *     backend (Admin SDK) escribe el feed.
 *
 * Detección de ciudad (prioridad):
 *   1. Campo `city` del doc del dispositivo (lo fija el admin).
 *   2. Campo `cityAuto` (resultado cacheado de una geocodificación previa).
 *   3. Reverse-geocode de lat/long del heartbeat vía Nominatim (OSM) — el
 *      resultado se guarda en `cityAuto` para no repetir la consulta.
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const { XMLParser } = require('fast-xml-parser');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

admin.initializeApp();
const db = admin.firestore();

const JOOBLE_API_KEY = defineSecret('JOOBLE_API_KEY');

const REGION = 'us-central1';
const JOBS_PER_CITY = 30;
const SNIPPET_MAX_CHARS = 500;
const NOMINATIM_UA = 'Naranti-SmartCity/1.0 (do@naranti.com.mx)';

// ─────────────────────────── Utilidades ───────────────────────────

/** "Morelia, Michoacán" -> "morelia-michoacan" (id estable de doc). */
function toCityId(city) {
  return String(city || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Quita etiquetas HTML y espacios repetidos del snippet de Jooble. */
function stripHtml(text) {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─────────────────────── Detección de ciudad ───────────────────────

async function reverseGeocodeCity(latitude, longitude) {
  const url =
    'https://nominatim.openstreetmap.org/reverse' +
    `?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}` +
    '&accept-language=es&zoom=10';

  const res = await fetch(url, { headers: { 'User-Agent': NOMINATIM_UA } });
  if (!res.ok) {
    throw new Error(`Nominatim HTTP ${res.status}`);
  }
  const data = await res.json();
  const addr = data.address || {};
  return addr.city || addr.town || addr.village || addr.municipality || addr.state || null;
}

/**
 * Devuelve un mapa { cityId -> cityName } con las ciudades distintas de la
 * flota. Cachea la ciudad geocodificada en `cityAuto` del doc del dispositivo.
 */
async function resolveFleetCities() {
  const snapshot = await db.collection('kiosks').get();
  const cities = new Map();

  for (const docSnap of snapshot.docs) {
    const device = docSnap.data();
    let city = String(device.city || '').trim() || String(device.cityAuto || '').trim();

    if (!city && typeof device.latitude === 'number' && typeof device.longitude === 'number') {
      try {
        city = await reverseGeocodeCity(device.latitude, device.longitude);
        if (city) {
          await docSnap.ref.set({ cityAuto: city }, { merge: true });
          logger.info(`Ciudad autodetectada para ${docSnap.id}: ${city}`);
        }
        // Cortesía con Nominatim: máx ~1 req/s.
        await new Promise((resolve) => setTimeout(resolve, 1100));
      } catch (error) {
        logger.warn(`Reverse geocode falló para ${docSnap.id}:`, error.message);
      }
    }

    const cityId = toCityId(city);
    if (cityId) cities.set(cityId, city);
  }

  return cities;
}

// ─────────────────────────── Jooble ───────────────────────────

async function fetchJoobleJobs(apiKey, cityName) {
  const body = JSON.stringify({ keywords: '', location: cityName, page: 1 });
  const hosts = ['https://mx.jooble.org', 'https://jooble.org'];

  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/api/${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      if (!res.ok) {
        logger.warn(`Jooble ${host} HTTP ${res.status} para "${cityName}"`);
        continue;
      }
      const data = await res.json();
      return Array.isArray(data.jobs) ? data.jobs : [];
    } catch (error) {
      logger.warn(`Jooble ${host} falló para "${cityName}":`, error.message);
    }
  }
  return null; // Ambos hosts fallaron (distinto de "0 vacantes").
}

function normalizeJoobleJob(raw) {
  return {
    id: String(raw.id || raw.link || ''),
    title: stripHtml(raw.title) || 'Vacante',
    company: stripHtml(raw.company) || 'Empresa confidencial',
    location: stripHtml(raw.location),
    type: stripHtml(raw.type),
    salary: stripHtml(raw.salary),
    description: stripHtml(raw.snippet).slice(0, SNIPPET_MAX_CHARS),
    link: String(raw.link || ''),
    updated: String(raw.updated || ''),
    source: stripHtml(raw.source) || 'Jooble'
  };
}

// ─────────────────────── Refresco principal ───────────────────────

async function refreshAllCities(apiKey) {
  const summary = { cities: 0, jobsWritten: 0, skipped: [], keyConfigured: true };

  if (!apiKey || apiKey === 'PENDING') {
    summary.keyConfigured = false;
    logger.warn('JOOBLE_API_KEY sin configurar — se detectan ciudades pero no se traen vacantes.');
  }

  const cities = await resolveFleetCities();
  logger.info(`Ciudades de la flota: ${[...cities.values()].join(', ') || '(ninguna)'}`);

  for (const [cityId, cityName] of cities) {
    summary.cities += 1;
    if (!summary.keyConfigured) continue;

    const rawJobs = await fetchJoobleJobs(apiKey, cityName);
    if (rawJobs === null) {
      summary.skipped.push(cityName);
      continue; // No pisamos el caché previo si la API falló.
    }

    const jobs = rawJobs
      .map(normalizeJoobleJob)
      .filter((job) => job.title && job.link)
      .slice(0, JOBS_PER_CITY);

    await db.collection('jobs').doc(cityId).set({
      city: cityName,
      cityId,
      jobs,
      totalFound: rawJobs.length,
      source: 'jooble',
      updatedAt: FieldValue.serverTimestamp()
    });

    summary.jobsWritten += jobs.length;
    logger.info(`jobs/${cityId}: ${jobs.length} vacantes guardadas.`);
  }

  return summary;
}

// ═══════════════════════ NOTICIAS (RSS de medios locales) ═══════════════════════
// Fuentes: RSS públicos de medios locales por ciudad, configurables en
// Firestore (`settings/news_feeds`) para poder agregar medios de nuevas
// ciudades desde el panel sin tocar código. En el kiosco se muestra titular +
// resumen + fuente citada + QR al artículo (sindicación estándar de RSS).

const NEWS_PER_CITY = 20;
const NEWS_IMAGE_LOOKUPS = 12; // solo buscamos og:image para las N más recientes
const FETCH_UA = 'Mozilla/5.0 (compatible; NarantiSmartCity/1.0; +https://naranti.com.mx)';

const DEFAULT_NEWS_FEEDS = {
  morelia: {
    city: 'Morelia',
    feeds: [
      { name: 'Quadratín Michoacán', url: 'https://www.quadratin.com.mx/feed/' },
      { name: 'La Voz de Michoacán', url: 'https://lavozdemichoacan.com.mx/feed/' },
      { name: 'Changoonga', url: 'https://www.changoonga.com/feed/' },
      { name: 'El Sol de Morelia', url: 'https://oem.com.mx/elsoldemorelia/rss' }
    ]
  }
};

/** Config de feeds por ciudad; se auto-crea con los medios de Morelia. */
async function getNewsFeedsConfig() {
  const ref = db.collection('settings').doc('news_feeds');
  const snap = await ref.get();
  if (!snap.exists || !snap.data().cities) {
    await ref.set({
      cities: DEFAULT_NEWS_FEEDS,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    logger.info('settings/news_feeds creado con los medios de Morelia por defecto.');
    return DEFAULT_NEWS_FEEDS;
  }
  return snap.data().cities;
}

async function fetchWithTimeout(url, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      headers: { 'User-Agent': FETCH_UA },
      signal: controller.signal,
      redirect: 'follow'
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Limpia el resumen de un item RSS (HTML + coletilla "La entrada..." de WordPress). */
function cleanRssSnippet(html) {
  let text = stripHtml(html);
  const wpTail = text.indexOf('La entrada ');
  if (wpTail > 20) text = text.slice(0, wpTail);
  return text.trim().slice(0, SNIPPET_MAX_CHARS);
}

function firstCategory(category) {
  const raw = Array.isArray(category) ? category[0] : category;
  const text = stripHtml(typeof raw === 'object' ? raw?.['#text'] : raw);
  return text ? text.slice(0, 30) : 'Local';
}

async function parseFeed(feed) {
  const res = await fetchWithTimeout(feed.url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();

  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  const channel = parsed?.rss?.channel || parsed?.feed;
  if (!channel) throw new Error('RSS sin canal reconocible');

  let items = channel.item || channel.entry || [];
  if (!Array.isArray(items)) items = [items];

  return items.map((item) => {
    const link = typeof item.link === 'object' ? (item.link?.['@_href'] || '') : String(item.link || '');
    const pubDate = item.pubDate || item.published || item.updated || '';
    const dateMs = Date.parse(pubDate);
    return {
      id: String(item.guid?.['#text'] || item.guid || link),
      title: stripHtml(typeof item.title === 'object' ? item.title?.['#text'] : item.title),
      source: feed.name,
      category: firstCategory(item.category),
      time: Number.isFinite(dateMs) ? new Date(dateMs).toISOString() : '',
      timeMs: Number.isFinite(dateMs) ? dateMs : 0,
      image: String(item['media:content']?.['@_url'] || item.enclosure?.['@_url'] || ''),
      content: cleanRssSnippet(item['content:encoded'] || item.description || item.summary || ''),
      link
    };
  }).filter((n) => n.title && n.link);
}

/** Busca la imagen og:image del artículo (best-effort). */
async function fetchOgImage(articleUrl) {
  try {
    const res = await fetchWithTimeout(articleUrl, 6000);
    if (!res.ok) return '';
    const html = (await res.text()).slice(0, 200000);
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match?.[1] || '';
  } catch {
    return '';
  }
}

async function refreshAllNews() {
  const summary = { cities: 0, itemsWritten: 0, feedErrors: [] };
  const config = await getNewsFeedsConfig();

  for (const [cityId, cityConfig] of Object.entries(config)) {
    const feeds = cityConfig?.feeds || [];
    if (feeds.length === 0) continue;
    summary.cities += 1;

    let items = [];
    for (const feed of feeds) {
      try {
        items.push(...await parseFeed(feed));
      } catch (error) {
        logger.warn(`Feed "${feed.name}" (${feed.url}) falló:`, error.message);
        summary.feedErrors.push(feed.name);
      }
    }

    // Dedupe por link, más recientes primero, tope por ciudad.
    const seen = new Set();
    items = items
      .filter((n) => !seen.has(n.link) && seen.add(n.link))
      .sort((a, b) => b.timeMs - a.timeMs)
      .slice(0, NEWS_PER_CITY);

    // Imagen real del artículo para las más recientes que no traigan una.
    for (const item of items.slice(0, NEWS_IMAGE_LOOKUPS)) {
      if (!item.image) item.image = await fetchOgImage(item.link);
    }

    if (items.length === 0) continue; // No pisar el caché si todos los feeds fallaron.

    await db.collection('news').doc(cityId).set({
      city: cityConfig.city || cityId,
      cityId,
      items: items.map(({ timeMs, ...rest }) => rest),
      source: 'rss-local',
      updatedAt: FieldValue.serverTimestamp()
    });

    summary.itemsWritten += items.length;
    logger.info(`news/${cityId}: ${items.length} noticias guardadas.`);
  }

  return summary;
}

// ─────────────────────── Autorización de admins ───────────────────────

async function assertAdmin(request) {
  const email = String(request.auth?.token?.email || '').toLowerCase();
  if (!email) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para usar esta función.');
  }
  const userDoc = await db.collection('users').doc(email).get();
  if (!userDoc.exists || userDoc.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo un administrador puede ejecutar esta acción.');
  }
  return email;
}

// ─────────────────────────── Triggers ───────────────────────────

exports.refreshJobs = onSchedule(
  {
    schedule: 'every 12 hours',
    region: REGION,
    timeoutSeconds: 300,
    memory: '256MiB',
    secrets: [JOOBLE_API_KEY]
  },
  async () => {
    const summary = await refreshAllCities(JOOBLE_API_KEY.value());
    logger.info('refreshJobs terminado:', summary);
  }
);

exports.refreshJobsNow = onCall(
  {
    region: REGION,
    timeoutSeconds: 300,
    memory: '256MiB',
    secrets: [JOOBLE_API_KEY]
  },
  async (request) => {
    const email = await assertAdmin(request);
    logger.info(`Refresco manual de empleos solicitado por ${email}`);
    return await refreshAllCities(JOOBLE_API_KEY.value());
  }
);

exports.refreshNews = onSchedule(
  {
    schedule: 'every 3 hours',
    region: REGION,
    timeoutSeconds: 300,
    memory: '256MiB'
  },
  async () => {
    const summary = await refreshAllNews();
    logger.info('refreshNews terminado:', summary);
  }
);

exports.refreshNewsNow = onCall(
  {
    region: REGION,
    timeoutSeconds: 300,
    memory: '256MiB'
  },
  async (request) => {
    const email = await assertAdmin(request);
    logger.info(`Refresco manual de noticias solicitado por ${email}`);
    return await refreshAllNews();
  }
);

// ─────────────────── Gestión de usuarios (solo admin) ───────────────────
// El alta/baja de cuentas se hace AQUÍ con el Admin SDK para poder tener el
// registro público (self-signup) DESHABILITADO en Firebase Auth: ningún
// externo puede crearse una cuenta, solo el admin da de alta desde el panel.

const VALID_ROLES = ['admin', 'kiosk', 'screen'];
const EMAIL_RE = /^\S+@\S+\.\S+$/;

exports.createManagedUser = onCall(
  { region: REGION, timeoutSeconds: 60, memory: '256MiB' },
  async (request) => {
    const adminEmail = await assertAdmin(request);

    const email = String(request.data?.email || '').trim().toLowerCase();
    const name = String(request.data?.name || '').trim();
    const password = String(request.data?.password || '');
    const role = String(request.data?.role || '');

    if (!EMAIL_RE.test(email)) {
      throw new HttpsError('invalid-argument', 'Correo inválido.');
    }
    if (!name) {
      throw new HttpsError('invalid-argument', 'El nombre es obligatorio.');
    }
    if (password.length < 6) {
      throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.');
    }
    if (!VALID_ROLES.includes(role)) {
      throw new HttpsError('invalid-argument', 'Rol inválido.');
    }

    // Crear la cuenta en Auth; si ya existe, re-autorizar actualizando su contraseña.
    let uid;
    try {
      const created = await admin.auth().createUser({ email, password, displayName: name });
      uid = created.uid;
    } catch (error) {
      if (error?.code === 'auth/email-already-exists') {
        const existing = await admin.auth().getUserByEmail(email);
        uid = existing.uid;
        await admin.auth().updateUser(uid, { password, displayName: name, disabled: false });
      } else {
        logger.error('createManagedUser: error creando cuenta Auth', error);
        throw new HttpsError('internal', 'No se pudo crear la cuenta.');
      }
    }

    // Whitelist en Firestore (la contraseña NUNCA se guarda aquí).
    await db.collection('users').doc(email).set({
      email,
      name,
      role,
      createdAt: FieldValue.serverTimestamp(),
      lastAccess: null
    });

    // Sincronizar flota para que aparezca en el selector de campañas.
    if (role === 'kiosk' || role === 'screen') {
      await db.collection('kiosks').doc(email).set({
        name,
        location: role === 'screen' ? 'Pantalla Naranti' : 'Kiosco Naranti',
        type: role,
        status: 'offline',
        createdAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    logger.info(`createManagedUser: ${adminEmail} dio de alta a ${email} (${role})`);
    return { ok: true, uid };
  }
);

exports.deleteManagedUser = onCall(
  { region: REGION, timeoutSeconds: 60, memory: '256MiB' },
  async (request) => {
    const adminEmail = await assertAdmin(request);
    const email = String(request.data?.email || '').trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      throw new HttpsError('invalid-argument', 'Correo inválido.');
    }
    if (email === adminEmail) {
      throw new HttpsError('failed-precondition', 'No puedes eliminar tu propia cuenta.');
    }

    // No dejar el sistema sin administradores.
    const targetDoc = await db.collection('users').doc(email).get();
    if (targetDoc.exists && targetDoc.data().role === 'admin') {
      const admins = await db.collection('users').where('role', '==', 'admin').get();
      if (admins.size <= 1) {
        throw new HttpsError('failed-precondition', 'No puedes eliminar al último administrador.');
      }
    }

    // Revocación REAL: además de quitarlo de la whitelist, se borra la cuenta
    // de Auth (sus sesiones/refresh tokens dejan de servir de inmediato).
    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().deleteUser(user.uid);
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') {
        logger.error('deleteManagedUser: error eliminando cuenta Auth', error);
        throw new HttpsError('internal', 'No se pudo eliminar la cuenta de Auth.');
      }
    }

    await db.collection('users').doc(email).delete();

    logger.info(`deleteManagedUser: ${adminEmail} revocó el acceso de ${email}`);
    return { ok: true };
  }
);
