import type { OrionConfig } from '../config/orion.config';
import type { LogEntry } from './logger';

/**
 * Contrato para una FUTURA integración con el centro de control de
 * Naranti SmartCity. Esta entrega NO implementa ninguna conexión real.
 *
 * El equipo de Naranti puede crear su propio adaptador (por ejemplo, uno que
 * lea la configuración remota y reporte estado) implementando esta interfaz
 * y registrándolo en `src/integration/index.ts`.
 */

export interface OrionStatus {
  app: 'orion-ficm-2026';
  version: string;
  /** Vista actual: "home" o el identificador del destino abierto. */
  view: string;
  online: boolean;
  enabled: boolean;
  withinSchedule: boolean;
  startedAt: string;
  uptimeSeconds: number;
  lastInteractionAt: string | null;
  lastError: LogEntry | null;
  viewport: { width: number; height: number; scale: number };
}

export type OrionCommand =
  | { type: 'goHome' }
  | { type: 'reload' }
  | { type: 'setEnabled'; enabled: boolean }
  | { type: 'setIdleTimeout'; seconds: number }
  | { type: 'setConfig'; patch: Partial<OrionConfig> };

export interface ControlCenterAdapter {
  readonly name: string;
  /** Se llama una vez al iniciar, con la configuración ya cargada. */
  init(config: OrionConfig): void | Promise<void>;
  /** Reporte periódico y en cada cambio de vista. */
  reportStatus(status: OrionStatus): void;
  /** Cada error o advertencia registrada. */
  logError(entry: LogEntry): void;
  /** Registra el receptor de comandos remotos. Devuelve la función para anularlo. */
  onCommand(handler: (command: OrionCommand) => void): () => void;
  dispose?(): void;
}
