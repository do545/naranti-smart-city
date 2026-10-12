import { logger } from '../integration/logger';

/**
 * Solicita pantalla completa al primer toque, SOLO si la configuración lo
 * pide (`kiosk.requestFullscreenOnTouch`). En el kiosco real normalmente lo
 * resuelve el propio navegador en modo kiosco; esto es un respaldo opcional.
 */
export function armFullscreenOnFirstTouch() {
  const handler = () => {
    window.removeEventListener('pointerdown', handler, true);
    const el = document.documentElement;
    if (document.fullscreenElement || !el.requestFullscreen) return;
    el.requestFullscreen({ navigationUI: 'hide' }).catch((err: unknown) => logger.warn('fullscreen-denied', String(err)));
  };
  window.addEventListener('pointerdown', handler, true);
  return () => window.removeEventListener('pointerdown', handler, true);
}
