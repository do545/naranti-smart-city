/**
 * Registro local de eventos y errores (búfer circular).
 * No envía nada a ningún servicio: el adaptador del centro de control decide,
 * en el futuro, qué hacer con cada entrada.
 */

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  at: string;
  level: LogLevel;
  event: string;
  detail?: unknown;
}

const MAX = 200;
const STORAGE_KEY = 'orion-ficm-2026:log';
const buffer: LogEntry[] = restore();
const listeners = new Set<(e: LogEntry) => void>();

function restore(): LogEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LogEntry[]) : [];
    return Array.isArray(parsed) ? parsed.slice(-MAX) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer.slice(-50)));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota): solo memoria.
  }
}

export function log(level: LogLevel, event: string, detail?: unknown) {
  const entry: LogEntry = { at: new Date().toISOString(), level, event, detail };
  buffer.push(entry);
  if (buffer.length > MAX) buffer.splice(0, buffer.length - MAX);
  if (level !== 'info') persist();
  listeners.forEach((fn) => fn(entry));
  if (import.meta.env.DEV) {
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info']('[ORION]', event, detail ?? '');
  }
}

export const logger = {
  info: (event: string, detail?: unknown) => log('info', event, detail),
  warn: (event: string, detail?: unknown) => log('warn', event, detail),
  error: (event: string, detail?: unknown) => log('error', event, detail),
  entries: () => [...buffer],
  lastError: () => [...buffer].reverse().find((e) => e.level === 'error') ?? null,
  subscribe: (fn: (e: LogEntry) => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function serializeError(err: unknown) {
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack?.split('\n').slice(0, 6).join('\n') };
  return { message: String(err) };
}
