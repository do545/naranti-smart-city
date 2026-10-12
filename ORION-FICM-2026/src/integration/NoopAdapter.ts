import type { ControlCenterAdapter } from './ControlCenterAdapter';

/** Adaptador por defecto: no se conecta a nada. */
export class NoopAdapter implements ControlCenterAdapter {
  readonly name = 'noop';
  init() {}
  reportStatus() {}
  logError() {}
  onCommand() {
    return () => {};
  }
}
