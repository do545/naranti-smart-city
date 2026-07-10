import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Kiosco: si el usuario abandona el tótem dentro de un módulo, tras
 * `seconds` de inactividad regresa solo a la pantalla principal, donde
 * corre el ciclo normal de publicidad. Cualquier interacción reinicia
 * el contador. (El protector de anuncios de cada módulo salta antes,
 * a los ~20s; esto es la red de seguridad para volver al inicio.)
 */
export default function useIdleReturnHome(seconds = 90, target = '/smartcity/display') {
  const navigate = useNavigate();

  useEffect(() => {
    let timer;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => navigate(target), seconds * 1000);
    };

    const events = ['pointerdown', 'touchstart', 'mousemove', 'keydown', 'scroll'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [navigate, seconds, target]);
}
