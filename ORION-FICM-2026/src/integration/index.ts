import type { OrionConfig } from '../config/orion.config';
import type { ControlCenterAdapter } from './ControlCenterAdapter';
import { LocalSimulationAdapter } from './LocalSimulationAdapter';
import { NoopAdapter } from './NoopAdapter';

/**
 * Punto único donde se elige el adaptador del centro de control.
 * Para la integración real, el equipo de Naranti sustituirá este selector
 * por su propio adaptador. Hoy: Noop (producción) o simulación local (debug).
 */
export function createAdapter(config: OrionConfig): ControlCenterAdapter {
  if (config.debug.panel) return new LocalSimulationAdapter();
  return new NoopAdapter();
}

export type { ControlCenterAdapter, OrionCommand, OrionStatus } from './ControlCenterAdapter';
