import type { OrionCommand, OrionStatus } from './ControlCenterAdapter';
import { logger, type LogEntry } from './logger';

/**
 * API local `window.ORION`, pensada para el agente del kiosco o para una
 * futura integración con el centro de control. No abre conexiones.
 *
 *   window.ORION.status()   → estado actual
 *   window.ORION.goHome()   → vuelve a la pantalla inicial
 *   window.ORION.reload()   → recarga la interfaz
 *   window.ORION.command({ type: 'setIdleTimeout', seconds: 90 })
 *   window.ORION.log()      → últimos eventos registrados
 */
export interface OrionApi {
  status: () => OrionStatus;
  goHome: () => void;
  reload: () => void;
  command: (cmd: OrionCommand) => void;
  log: () => LogEntry[];
}

declare global {
  interface Window {
    ORION?: OrionApi;
  }
}

export function exposeOrionApi(deps: { status: () => OrionStatus; command: (cmd: OrionCommand) => void }) {
  window.ORION = {
    status: deps.status,
    goHome: () => deps.command({ type: 'goHome' }),
    reload: () => deps.command({ type: 'reload' }),
    command: deps.command,
    log: logger.entries,
  };
  return () => {
    delete window.ORION;
  };
}
