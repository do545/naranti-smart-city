import { useEffect } from 'react';
import { logger } from '../integration/logger';

/**
 * Protecciones de modo kiosco (solo dentro de esta página; no toca el sistema):
 *  - Sin menú contextual (pulsación larga), arrastre de imágenes ni selección.
 *  - Sin zoom por pellizco, doble toque ni Ctrl + rueda / Ctrl + "+".
 *  - El botón "atrás" del navegador no saca al visitante de la experiencia.
 */
export function useKioskGuards(enabled: boolean, onBack: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const prevent = (e: Event) => e.preventDefault();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault();
    };

    // Retroceso del navegador: se mantiene una entrada propia en el historial.
    history.pushState({ orion: true }, '');
    const onPop = () => {
      history.pushState({ orion: true }, '');
      logger.info('history-back-blocked');
      onBack();
    };

    document.addEventListener('contextmenu', prevent);
    document.addEventListener('dragstart', prevent);
    document.addEventListener('selectstart', prevent);
    document.addEventListener('gesturestart', prevent);
    document.addEventListener('dblclick', prevent);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);
    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('dragstart', prevent);
      document.removeEventListener('selectstart', prevent);
      document.removeEventListener('gesturestart', prevent);
      document.removeEventListener('dblclick', prevent);
      document.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
    };
  }, [enabled, onBack]);
}
