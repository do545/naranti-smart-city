/**
 * ORION · FICM 2026 — Configuración por defecto.
 *
 * Estos valores se combinan, en este orden, con:
 *   1. `public/orion.config.json`  (editable tras compilar: `dist/orion.config.json`)
 *   2. Parámetros de la URL         (?idle=60&w=1080&h=1920&debug=1 …)
 *
 * NO contiene credenciales ni conexiones a servicios. Las URLs que todavía no
 * han sido verificadas por el equipo de Naranti se dejan en `null`.
 */

export type DestinationId = 'secciones' | 'sedes' | 'cinepolis' | 'ficm';

/**
 * Cómo se abre un destino:
 *  - preview: pantalla interna de demostración (no carga ningún sitio externo).
 *  - iframe:  carga el sitio dentro del kiosco con barra de regreso fija.
 *             Si el sitio no lo permite o no responde a tiempo → respaldo QR.
 *  - qr:      muestra un código QR para continuar en el teléfono del visitante.
 */
export type NavigationMode = 'preview' | 'iframe' | 'qr';

export interface OrionConfig {
  version: string;
  festival: {
    edition: string;
    name: string;
    datesLabel: string;
  };
  display: {
    /** Lienzo de diseño. La interfaz se escala para ocupar la pantalla real. */
    width: number;
    height: number;
  };
  links: Record<DestinationId, string | null>;
  navigation: {
    mode: NavigationMode;
    /** Segundos de espera antes de pasar al respaldo QR en modo iframe. */
    iframeTimeoutSeconds: number;
    /** Ampliación de los sitios integrados para la pantalla vertical (1 = sin ampliar, máx. 2). */
    iframeZoom: number;
    /** Modo específico por destino (p. ej. un sitio que no permite iframe → "qr"). */
    overrides: Record<DestinationId, NavigationMode | null>;
  };
  idle: {
    enabled: boolean;
    /** Segundos sin interacción antes del aviso "¿Sigues ahí?". */
    timeoutSeconds: number;
    /** Duración de la cuenta atrás del aviso antes de volver al inicio. */
    warningSeconds: number;
  };
  kiosk: {
    /** Bloquea zoom, menú contextual, selección, arrastre y retroceso del navegador. */
    guards: boolean;
    /** Solicita pantalla completa al primer toque (desactivado por defecto). */
    requestFullscreenOnTouch: boolean;
    /** Segundos antes de recargar la interfaz tras un error de render. */
    errorReloadSeconds: number;
  };
  schedule: {
    /** Si es `false` la experiencia está siempre disponible. */
    enabled: boolean;
    start: string;
    end: string;
  };
  experience: {
    /** Permite desactivar la experiencia (pantalla de "no disponible"). */
    enabled: boolean;
    /** EXPERIMENTAL: rollo que gira y palomas en vuelo. Desactivado hasta su revisión. */
    animatedHeader: boolean;
  };
  performance: {
    /** Desactiva desenfoques y reduce animaciones en hardware modesto. */
    lowPower: boolean;
  };
  debug: {
    /** Muestra el panel de simulación. También con `?debug=1`. */
    panel: boolean;
  };
}

export const defaultConfig: OrionConfig = {
  version: '1.0.0',
  festival: {
    edition: '24.º',
    name: 'Festival Internacional de Cine de Morelia',
    datesLabel: '16 al 25 de octubre, 2026',
  },
  display: {
    width: 1080,
    height: 1920,
  },
  links: {
    sedes: null,
    secciones: null,
    cinepolis: 'https://cinepolis.com/mx',
    ficm: 'https://moreliafilmfest.com/noticias',
  },
  navigation: {
    mode: 'iframe',
    iframeTimeoutSeconds: 10,
    iframeZoom: 1.25,
    overrides: {
      sedes: null,
      secciones: null,
      cinepolis: null,
      ficm: null,
    },
  },
  idle: {
    enabled: true,
    timeoutSeconds: 60,
    warningSeconds: 10,
  },
  kiosk: {
    guards: true,
    requestFullscreenOnTouch: false,
    errorReloadSeconds: 8,
  },
  schedule: {
    enabled: false,
    start: '2026-10-16T00:00:00-06:00',
    end: '2026-10-25T23:59:59-06:00',
  },
  experience: {
    enabled: true,
    animatedHeader: true,
  },
  performance: {
    lowPower: false,
  },
  debug: {
    panel: false,
  },
};
