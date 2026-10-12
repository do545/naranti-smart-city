import { useState } from 'react';
import type { NavigationMode } from '../config/orion.config';
import type { OrionStatus } from '../integration/ControlCenterAdapter';

/**
 * Panel de SIMULACIÓN para pruebas locales (`?debug=1`).
 * Se dibuja fuera del lienzo del kiosco y no existe si `debug.panel` es falso.
 */

export interface Simulation {
  offline: boolean;
  outOfSchedule: boolean;
  disabled: boolean;
  crash: boolean;
  showTouch: boolean;
  idleSeconds: number | null;
  screen: { width: number; height: number } | null;
  mode: NavigationMode | null;
}

export const initialSimulation: Simulation = {
  offline: false,
  outOfSchedule: false,
  disabled: false,
  crash: false,
  showTouch: false,
  idleSeconds: null,
  screen: null,
  mode: null,
};

const SCREENS = [
  { label: 'Ventana', value: null },
  { label: '1080 × 1920', value: { width: 1080, height: 1920 } },
  { label: '2160 × 3840', value: { width: 2160, height: 3840 } },
  { label: '1080 × 1600', value: { width: 1080, height: 1600 } },
  { label: '768 × 1366', value: { width: 768, height: 1366 } },
  { label: '1200 × 1920', value: { width: 1200, height: 1920 } },
];

interface Props {
  sim: Simulation;
  setSim: (fn: (s: Simulation) => Simulation) => void;
  status: () => OrionStatus;
  onHome: () => void;
}

export function DebugPanel({ sim, setSim, status, onHome }: Props) {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<string>('');
  const toggle = (key: 'offline' | 'outOfSchedule' | 'disabled' | 'showTouch') => setSim((s) => ({ ...s, [key]: !s[key] }));

  if (!open) {
    return (
      <button type="button" className="debug-toggle" onClick={() => setOpen(true)}>
        Simulación
      </button>
    );
  }

  return (
    <aside className="debug-panel" aria-label="Panel de simulación">
      <header>
        <strong>ORION · Simulación local</strong>
        <button type="button" onClick={() => setOpen(false)}>
          Cerrar
        </button>
      </header>

      <section>
        <h3>Estados</h3>
        <label>
          <input type="checkbox" checked={sim.offline} onChange={() => toggle('offline')} /> Sin conexión
        </label>
        <label>
          <input type="checkbox" checked={sim.outOfSchedule} onChange={() => toggle('outOfSchedule')} /> Fuera de fechas
        </label>
        <label>
          <input type="checkbox" checked={sim.disabled} onChange={() => toggle('disabled')} /> Experiencia desactivada
        </label>
        <label>
          <input type="checkbox" checked={sim.showTouch} onChange={() => toggle('showTouch')} /> Mostrar zonas táctiles
        </label>
      </section>

      <section>
        <h3>Acciones</h3>
        <div className="debug-row">
          <button type="button" onClick={() => setSim((s) => ({ ...s, idleSeconds: s.idleSeconds ? null : 5 }))}>
            {sim.idleSeconds ? 'Inactividad normal' : 'Inactividad en 5 s'}
          </button>
          <button type="button" onClick={() => setSim((s) => ({ ...s, crash: true }))}>
            Simular error
          </button>
          <button type="button" onClick={onHome}>
            Ir al inicio
          </button>
        </div>
      </section>

      <section>
        <h3>Modo de apertura</h3>
        <div className="debug-row">
          {([null, 'preview', 'qr', 'iframe'] as (NavigationMode | null)[]).map((m) => (
            <button
              key={String(m)}
              type="button"
              className={sim.mode === m ? 'is-active' : ''}
              onClick={() => setSim((s) => ({ ...s, mode: m }))}
            >
              {m ?? 'Config.'}
            </button>
          ))}
        </div>
        <p className="debug-note">El modo «iframe» cargará sitios externos reales: úsalo solo para pruebas autorizadas.</p>
      </section>

      <section>
        <h3>Pantalla</h3>
        <div className="debug-row">
          {SCREENS.map((sc) => (
            <button
              key={sc.label}
              type="button"
              className={JSON.stringify(sim.screen) === JSON.stringify(sc.value) ? 'is-active' : ''}
              onClick={() => setSim((s) => ({ ...s, screen: sc.value }))}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>Estado (window.ORION.status())</h3>
        <button type="button" onClick={() => setSnapshot(JSON.stringify(status(), null, 2))}>
          Actualizar
        </button>
        {snapshot && <pre>{snapshot}</pre>}
      </section>
    </aside>
  );
}

/** Componente que falla a propósito para probar la recuperación ante errores. */
export function CrashProbe({ crash }: { crash: boolean }) {
  if (crash) throw new Error('Error simulado desde el panel de simulación');
  return null;
}
