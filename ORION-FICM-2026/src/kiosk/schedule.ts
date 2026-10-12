import type { OrionConfig } from '../config/orion.config';

/**
 * Ventana de disponibilidad por fechas (16–25 oct 2026, hora de Morelia).
 * Desactivada por defecto (`schedule.enabled = false`): la experiencia está
 * siempre disponible hasta que el equipo de Naranti decida activarla.
 */
export function isWithinSchedule(schedule: OrionConfig['schedule'], now = new Date()) {
  if (!schedule.enabled) return true;
  const start = Date.parse(schedule.start);
  const end = Date.parse(schedule.end);
  if (Number.isNaN(start) || Number.isNaN(end)) return true;
  const t = now.getTime();
  return t >= start && t <= end;
}
