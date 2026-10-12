import { useEffect, useState, type ReactNode } from 'react';

/**
 * Lienzo del kiosco.
 *
 * La interfaz se diseña sobre un lienzo de referencia (1080 × 1920 por defecto)
 * y se escala desde el código, sin tocar la resolución del dispositivo:
 *
 *  - El ancho del lienzo se ajusta al ancho de la pantalla.
 *  - La altura se adapta a la pantalla para aprovecharla entera; si la pantalla
 *    es más baja que el 84 % de la altura de diseño, se escala por altura para
 *    que nada quede cortado (bandas de papel marfil a los lados).
 *
 * `screenOverride` permite simular otra pantalla (panel de simulación).
 */

export interface StageMetrics {
  width: number;
  height: number;
  scale: number;
  screen: { width: number; height: number };
}

const MIN_HEIGHT_RATIO = 0.84;

export function computeStage(designW: number, designH: number, screenW: number, screenH: number): StageMetrics {
  const minH = designH * MIN_HEIGHT_RATIO;
  const scale = Math.min(screenW / designW, screenH / minH);
  return {
    width: Math.max(designW, screenW / scale),
    height: Math.max(minH, screenH / scale),
    scale,
    screen: { width: screenW, height: screenH },
  };
}

function useWindowSize() {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSize({ width: window.innerWidth, height: window.innerHeight }));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return size;
}

interface Props {
  designWidth: number;
  designHeight: number;
  screenOverride?: { width: number; height: number } | null;
  onMetrics?: (m: StageMetrics) => void;
  children: (m: StageMetrics) => ReactNode;
}

export function KioskStage({ designWidth, designHeight, screenOverride, onMetrics, children }: Props) {
  const win = useWindowSize();
  const screen = screenOverride ?? win;
  const m = computeStage(designWidth, designHeight, screen.width, screen.height);

  // Simulación de otra pantalla: se dibuja un marco que cabe en la ventana.
  const preview = screenOverride ? Math.min(win.width / screen.width, win.height / screen.height, 1) * 0.94 : 1;

  useEffect(() => {
    onMetrics?.(m);
  }, [m.width, m.height, m.scale]);

  const stage = (
    <div
      className="stage"
      style={{
        width: m.width,
        height: m.height,
        transform: `scale(${m.scale * preview})`,
      }}
    >
      {children(m)}
    </div>
  );

  if (!screenOverride) return <div className="stage-viewport">{stage}</div>;

  return (
    <div className="stage-viewport stage-viewport--simulated">
      <div
        className="stage-frame"
        style={{ width: screen.width * preview, height: screen.height * preview }}
        data-label={`${screen.width} × ${screen.height}`}
      >
        {stage}
      </div>
    </div>
  );
}
