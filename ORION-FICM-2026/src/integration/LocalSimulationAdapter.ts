import type { ControlCenterAdapter, OrionCommand, OrionStatus } from './ControlCenterAdapter';
import type { LogEntry } from './logger';

/**
 * Adaptador de SIMULACIÓN LOCAL. Solo se comunica dentro del mismo navegador:
 *
 *  - BroadcastChannel "orion-ficm-2026": otra pestaña del mismo origen puede
 *    enviar comandos y recibir el estado (ver docs/INTEGRACION-CENTRO-DE-CONTROL.md).
 *  - window.postMessage: una página que contenga ORION en un iframe puede
 *    enviar `{ orion: { type: 'goHome' } }`.
 *
 * No realiza peticiones de red. Se activa con `?debug=1`.
 */
export class LocalSimulationAdapter implements ControlCenterAdapter {
  readonly name = 'local-simulation';
  private channel: BroadcastChannel | null = null;
  private handlers = new Set<(c: OrionCommand) => void>();
  private onWindowMessage = (ev: MessageEvent) => {
    const data = ev.data as { orion?: OrionCommand } | null;
    if (data && typeof data === 'object' && data.orion && typeof data.orion.type === 'string') {
      this.handlers.forEach((h) => h(data.orion as OrionCommand));
    }
  };

  init() {
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('orion-ficm-2026');
      this.channel.onmessage = (ev) => {
        const cmd = ev.data as OrionCommand;
        if (cmd && typeof cmd.type === 'string') this.handlers.forEach((h) => h(cmd));
      };
    }
    window.addEventListener('message', this.onWindowMessage);
  }

  reportStatus(status: OrionStatus) {
    this.channel?.postMessage({ kind: 'status', status });
  }

  logError(entry: LogEntry) {
    this.channel?.postMessage({ kind: 'log', entry });
  }

  onCommand(handler: (c: OrionCommand) => void) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  dispose() {
    this.channel?.close();
    window.removeEventListener('message', this.onWindowMessage);
  }
}
