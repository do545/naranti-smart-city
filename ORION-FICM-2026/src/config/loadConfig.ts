import { defaultConfig, type NavigationMode, type OrionConfig } from './orion.config';

/**
 * Combina: valores por defecto ← `orion.config.json` (junto a index.html) ← URL.
 * Cualquier valor inválido se ignora y se conserva el anterior, de modo que un
 * error de edición en el JSON nunca deja el kiosco en blanco.
 */

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Mezcla profunda tipada: solo acepta claves existentes y del mismo tipo. */
function mergeKnown<T>(base: T, patch: unknown): T {
  if (!isObject(patch) || !isObject(base)) return base;
  const out: Json = { ...(base as Json) };
  for (const [key, current] of Object.entries(base as Json)) {
    if (!(key in patch)) continue;
    const next = patch[key];
    if (isObject(current)) {
      out[key] = mergeKnown(current, next);
    } else if (current === null || typeof current === 'string') {
      // Campos de texto o URL (pueden quedar en null).
      if (next === null || typeof next === 'string') out[key] = next;
    } else if (typeof next === typeof current) {
      out[key] = next;
    }
  }
  return out as T;
}

const isSafeUrl = (u: string | null) => {
  if (u === null) return true;
  try {
    const url = new URL(u);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

function sanitize(cfg: OrionConfig): OrionConfig {
  const c = structuredClone(cfg);
  for (const key of Object.keys(c.links) as (keyof OrionConfig['links'])[]) {
    const value = c.links[key];
    if (typeof value === 'string' && value.trim() === '') c.links[key] = null;
    if (!isSafeUrl(c.links[key])) c.links[key] = null;
  }
  const modes: NavigationMode[] = ['preview', 'iframe', 'qr'];
  if (!modes.includes(c.navigation.mode)) c.navigation.mode = 'preview';
  for (const key of Object.keys(c.navigation.overrides) as (keyof OrionConfig['links'])[]) {
    const m = c.navigation.overrides[key];
    if (m !== null && !modes.includes(m)) c.navigation.overrides[key] = null;
  }
  c.display.width = clamp(c.display.width, 320, 7680, defaultConfig.display.width);
  c.display.height = clamp(c.display.height, 320, 7680, defaultConfig.display.height);
  c.idle.timeoutSeconds = clamp(c.idle.timeoutSeconds, 5, 3600, defaultConfig.idle.timeoutSeconds);
  c.idle.warningSeconds = clamp(c.idle.warningSeconds, 0, 120, defaultConfig.idle.warningSeconds);
  c.kiosk.errorReloadSeconds = clamp(c.kiosk.errorReloadSeconds, 2, 600, defaultConfig.kiosk.errorReloadSeconds);
  c.navigation.iframeTimeoutSeconds = clamp(c.navigation.iframeTimeoutSeconds, 2, 60, 10);
  c.navigation.iframeZoom = clamp(c.navigation.iframeZoom, 1, 2, 1.25);
  return c;
}

function clamp(n: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Parámetros de URL admitidos (útiles para pruebas y para el centro de control). */
function fromUrl(search: string, hash = ''): Json {
  const p = new URLSearchParams(search);
  // Alternativa con ancla (#debug, #lowpower) para entornos que no transmiten
  // la cadena de consulta, p. ej. un visor de vista previa.
  for (const token of hash.replace(/^#/, '').split(/[,&]/)) {
    if ((token === 'debug' || token === 'lowpower') && !p.has(token)) p.set(token, '1');
  }
  const num = (k: string) => (p.has(k) ? Number(p.get(k)) : undefined);
  const bool = (k: string) => (p.has(k) ? ['1', 'true', 'si', 'sí'].includes(String(p.get(k)).toLowerCase()) : undefined);
  const patch: Json = {};
  const set = (path: string[], value: unknown) => {
    if (value === undefined || (typeof value === 'number' && Number.isNaN(value))) return;
    let node = patch;
    path.slice(0, -1).forEach((k) => {
      node[k] = isObject(node[k]) ? node[k] : {};
      node = node[k] as Json;
    });
    node[path[path.length - 1]] = value;
  };
  set(['display', 'width'], num('w'));
  set(['display', 'height'], num('h'));
  set(['idle', 'timeoutSeconds'], num('idle'));
  set(['idle', 'warningSeconds'], num('warning'));
  set(['debug', 'panel'], bool('debug'));
  set(['performance', 'lowPower'], bool('lowpower'));
  set(['kiosk', 'guards'], bool('guards'));
  if (p.has('mode')) set(['navigation', 'mode'], p.get('mode'));
  return patch;
}

export async function loadConfig(): Promise<{ config: OrionConfig; source: string[] }> {
  const source = ['defaults'];
  let cfg = defaultConfig;
  try {
    const res = await fetch('./orion.config.json', { cache: 'no-store' });
    if (res.ok) {
      cfg = mergeKnown(cfg, await res.json());
      source.push('orion.config.json');
    }
  } catch {
    // Sin archivo o JSON inválido: se mantienen los valores por defecto.
  }
  const urlPatch = fromUrl(window.location.search, window.location.hash);
  if (Object.keys(urlPatch).length) {
    cfg = mergeKnown(cfg, urlPatch);
    source.push('url');
  }
  return { config: sanitize(cfg), source };
}

export { mergeKnown, sanitize };
