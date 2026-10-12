import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reinicio por inactividad.
 *
 * Mientras `active` sea verdadero (hay un destino abierto), si nadie toca la
 * pantalla durante `timeoutSeconds` aparece el aviso "¿Sigues ahí?" con una
 * cuenta atrás de `warningSeconds`; al terminar se llama a `onReset`.
 * Cualquier toque reinicia el contador y cierra el aviso.
 */
export function useIdleReset(opts: {
  enabled: boolean;
  active: boolean;
  timeoutSeconds: number;
  warningSeconds: number;
  onReset: () => void;
  onInteraction?: () => void;
}) {
  const { enabled, active, timeoutSeconds, warningSeconds, onReset, onInteraction } = opts;
  const last = useRef(Date.now());
  const [remaining, setRemaining] = useState<number | null>(null);
  const resetRef = useRef(onReset);
  const interactionRef = useRef(onInteraction);
  resetRef.current = onReset;
  interactionRef.current = onInteraction;

  const touch = useCallback(() => {
    last.current = Date.now();
    setRemaining(null);
    interactionRef.current?.();
  }, []);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'touchstart', 'keydown', 'wheel'];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true, capture: true }));
    return () => events.forEach((e) => window.removeEventListener(e, touch, { capture: true }));
  }, [touch]);

  // Al abrir o cerrar un destino, el contador vuelve a empezar.
  useEffect(() => {
    last.current = Date.now();
    setRemaining(null);
  }, [active, timeoutSeconds]);

  useEffect(() => {
    if (!enabled || !active) return;
    const id = window.setInterval(() => {
      const idle = (Date.now() - last.current) / 1000;
      if (idle < timeoutSeconds) {
        setRemaining((r) => (r === null ? r : null));
        return;
      }
      const left = Math.ceil(timeoutSeconds + warningSeconds - idle);
      if (left <= 0) {
        setRemaining(null);
        last.current = Date.now();
        resetRef.current();
      } else {
        setRemaining(left);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [enabled, active, timeoutSeconds, warningSeconds]);

  return { remaining, dismiss: touch };
}
